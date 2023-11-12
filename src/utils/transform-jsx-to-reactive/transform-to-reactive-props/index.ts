import { ESTree } from "meriyah";
import getWebComponentAst from "../get-web-component-ast";
import getPropsNames from "../get-props-names";

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
  const propsNamesSet = new Set([...propsNames, ...renamedPropsNames]);
  const defaultPropsEntries = Object.entries(defaultPropsValues);

  // Set default props values inside component body
  for (let [propName, propValue] of defaultPropsEntries) {
    if (component.body == null) continue;
    component.body.body.unshift({
      type: "IfStatement",
      test: {
        type: "BinaryExpression",
        operator: "==",
        left: {
          type: "Identifier",
          name: propName,
        },
        right: {
          type: "Literal",
          value: null,
        },
      },
      consequent: {
        type: "ExpressionStatement",
        expression: {
          type: "AssignmentExpression",
          operator: "=",
          left: {
            type: "Identifier",
            name: propName,
          },
          right: propValue,
        },
      },
    } as ESTree.IfStatement);
  }

  // Remove props from component params
  for (let propParam of (component.params[0] as any)?.properties ?? []) {
    const propName =
      propParam.value?.left?.name ??
      propParam.value?.name ??
      propParam.key?.name;

    if (
      propParam?.type !== "Property" ||
      !propName ||
      !propsNamesSet.has(propName) ||
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
      // Avoid adding .value in props used inside a variable declaration
      if (value?.type === "VariableDeclaration") {
        return JSON.parse(JSON.stringify(value), (key, value) => {
          return value?.isSignal ? value.object : value;
        });
      }

      const isPropFromObjectExpression =
        this?.type === "Property" && this?.key === value;

      if (
        value?.type === "Identifier" &&
        propsNamesSet.has(value?.name) &&
        !isPropFromObjectExpression
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
