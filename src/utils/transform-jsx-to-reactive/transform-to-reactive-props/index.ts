import { ESTree } from "meriyah";
import getWebComponentAst from "../get-web-component-ast";
import getPropsNames from "../get-props-names";

const SUPPORTED_DEFAULT_PROPS_OPERATORS = new Set(['??', '||']);

export default function transformToReactiveProps(
  ast: ESTree.Program,
): [ESTree.Program, string[]] {
  const [component, defaultExportIndex] = getWebComponentAst(ast) as [
    ESTree.FunctionDeclaration,
    number,
  ];

  if (!component) return [ast, []];

  const [propsNames, renamedPropsNames, defaultPropsValues] =
    getPropsNames(component);
  const propsNamesAndRenamesSet = new Set([...propsNames, ...renamedPropsNames]);
  const defaultPropsEntries = Object.entries(defaultPropsValues);
  const defaultPropsEntriesInnerCode: [string, ESTree.Literal, string][] = [];

  // Set default props values inside component body
  addDefaultPropsToBody(defaultPropsEntries, component, false);

  // Remove props from component params
  for (let propParam of (component.params[0] as any)?.properties ?? []) {
    const propName =
      propParam.value?.left?.name ??
      propParam.value?.name ??
      propParam.key?.name;

    if (
      propParam?.type !== "Property" ||
      !propName ||
      !propsNamesAndRenamesSet.has(propName) ||
      !defaultPropsValues[propName] ||
      propParam?.value?.right?.value !== defaultPropsValues[propName]?.value
    ) {
      continue;
    }

    propParam.value = {
      type: "Identifier",
      name: propParam?.value?.left?.name,
    };
  }

  const componentBodyWithPropsDotValue = JSON.parse(
    JSON.stringify(component.body),
    function (key, value) {
      const nameLeft = value?.left?.name ?? value?.left?.object?.name ?? value?.left?.property?.name

      // default props values inside component body like:
      // const foo = bar ?? 'default value';
      if (value?.type === "LogicalExpression" && SUPPORTED_DEFAULT_PROPS_OPERATORS.has(value?.operator) && propsNamesAndRenamesSet.has(nameLeft)) {
        defaultPropsEntriesInnerCode.push([nameLeft, value.right, value?.operator]);
        return {
          type: "Identifier",
          name: nameLeft,
        };
      }

      // Avoid adding .value in props used inside a variable declaration
      if (value?.type === "VariableDeclarator" && value?.init?.type !== 'ArrowFunctionExpression') {
        return JSON.parse(JSON.stringify(value), (key, value) => {
          return value?.isSignal ? value.object : value;
        });
      }

      const isPropFromObjectExpression =
        this?.type === "Property" && this?.key === value;

      if (
        value?.type === "Identifier" &&
        propsNamesAndRenamesSet.has(value?.name) &&
        !isPropFromObjectExpression &&
        !value?.name?.startsWith("on")
      ) {
        // allow: console.log({ propName })
        // transforming to: console.log({ propName: propName.value })
        if (this?.type === "Property") this.shorthand = false;

        // add signal, transforming:
        //  <div>{propName}</div>
        // to:
        //  <div>{propName.value}</div>
        return {
          type: "MemberExpression",
          object: value,
          property: {
            type: "Identifier",
            name: "value",
          },
          computed: false,
          isSignal: true,
        };
      }

      return value;
    },
  );

  // Set default props values detected inside the body inside component body
  addDefaultPropsToBody(defaultPropsEntriesInnerCode, componentBodyWithPropsDotValue, true);

  const newAst = {
    ...ast,
    body: ast.body.map((node, index) => {
      if (index === defaultExportIndex)
        return {
          ...node,
          declaration: {
            ...(node as ESTree.ExportDefaultDeclaration).declaration,
            body: componentBodyWithPropsDotValue,
          },
        };
      return node;
    }),
  } as ESTree.Program;

  return [newAst, propsNames];
}

function addDefaultPropsToBody(defaultPropsEntries: [string, ESTree.Literal, string?][], component: ESTree.FunctionDeclaration, useSignalValueField: boolean) {
  for (let [propName, propValue, operator = '??'] of defaultPropsEntries) {
    if (component.body == null) continue;

    const prop = useSignalValueField ? {
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: propName,
      },
      property: {
        type: "Identifier",
        name: "value",
      },
      computed: false,
      isSignal: true,
    } : {
      type: "Identifier",
      name: propName,
    };

    (component.body.body ?? component.body).unshift({
      type: "IfStatement",
      test: operator === '??' ? {
        type: "BinaryExpression",
        operator: "==",
        left: prop,
        right: {
          type: "Literal",
          value: null,
        },
      } : {
        type: "UnaryExpression",
        operator: "!",
        prefix: true,
        argument: prop,
      },
      consequent: {
        type: "ExpressionStatement",
        expression: {
          type: "AssignmentExpression",
          operator: "=",
          left: prop,
          right: propValue,
        },
      },
    } as ESTree.IfStatement);
  }
}
