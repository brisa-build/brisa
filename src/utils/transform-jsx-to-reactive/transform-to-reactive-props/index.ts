import { ESTree } from "meriyah";
import getWebComponentAst from "../get-web-component-ast";
import getPropsNames, { getPropNamesFromExport } from "../get-props-names";
import { SUPPORTED_DEFAULT_PROPS_OPERATORS } from "../constants";

type Prop = (ESTree.MemberExpression | ESTree.Identifier) & {
  isSignal?: true;
};

export default function transformToReactiveProps(
  ast: ESTree.Program
): [ESTree.Program, string[], boolean] {
  const [component, defaultExportIndex] = getWebComponentAst(ast) as [
    ESTree.FunctionDeclaration,
    number
  ];

  if (!component) return [ast, [], false];

  const propNamesFromExport = getPropNamesFromExport(ast);
  const [propsNames, renamedPropsNames, defaultPropsValues] = getPropsNames(
    component,
    propNamesFromExport
  );
  const propsNamesAndRenamesSet = new Set([
    ...propsNames,
    ...renamedPropsNames,
    ...propNamesFromExport,
  ]);
  const defaultPropsEntries = Object.entries(defaultPropsValues);
  const defaultPropsEntriesInnerCode: [string, ESTree.Literal, string][] = [];
  let isAddedDefaultProps = false;

  // Set default props values inside component body
  isAddedDefaultProps ||= addDefaultPropsToBody(
    defaultPropsEntries,
    component,
    false
  );

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
      const nameLeft =
        value?.left?.property?.object?.name ??
        value?.left?.name ??
        value?.left?.object?.name ??
        value?.left?.property?.name;

      // default props values inside component body like:
      // const foo = bar ?? 'default value';
      if (
        value?.type === "LogicalExpression" &&
        SUPPORTED_DEFAULT_PROPS_OPERATORS.has(value?.operator) &&
        propsNamesAndRenamesSet.has(nameLeft)
      ) {
        const propsIdentifier = value?.left?.object?.name;
        const isPropsIdentifier = propsIdentifier !== nameLeft;
        const property = { type: "Identifier", name: nameLeft };

        defaultPropsEntriesInnerCode.push([
          isPropsIdentifier ? `${propsIdentifier}.${nameLeft}` : nameLeft,
          value.right,
          value?.operator,
        ]);

        return isPropsIdentifier
          ? {
              type: "MemberExpression",
              object: {
                type: "Identifier",
                name: propsIdentifier,
              },
              property,
              computed: false,
            }
          : property;
      }

      // Avoid adding .value in props used inside a variable declaration
      if (
        value?.type === "VariableDeclarator" &&
        value?.init?.type !== "ArrowFunctionExpression"
      ) {
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
    }
  );

  // Set default props values detected inside the body inside component body
  isAddedDefaultProps ||= addDefaultPropsToBody(
    defaultPropsEntriesInnerCode,
    componentBodyWithPropsDotValue,
    true
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

  return [newAst, propsNames, isAddedDefaultProps];
}

// Set default props values inside component body
function addDefaultPropsToBody(
  defaultPropsEntries: [string, ESTree.Literal, string?][],
  component: ESTree.FunctionDeclaration,
  useSignalValueField: boolean
) {
  let isAddedDefaultProps = false;

  for (let [propName, propValue, usedOperator = "??"] of defaultPropsEntries) {
    if (component.body == null) continue;

    const operator =
      ((propValue as any)?.usedOperator ?? usedOperator) === "??"
        ? "??="
        : "||=";

    let identifier;

    if (propName.includes(".")) [identifier, propName] = propName.split(".");

    let prop: Prop = identifier
      ? {
          type: "MemberExpression",
          object: {
            type: "Identifier",
            name: identifier,
          },
          property: {
            type: "Identifier",
            name: propName,
          },
          computed: false,
        }
      : {
          type: "Identifier",
          name: propName,
        };

    if (useSignalValueField) {
      prop = {
        type: "MemberExpression",
        object: prop,
        property: {
          type: "Identifier",
          name: "value",
        },
        computed: false,
        isSignal: true,
      };
    }

    (component.body.body ?? component.body).unshift({
      type: "ExpressionStatement",
      isEffect: true,
      expression: {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "effect",
        },
        arguments: [
          {
            type: "ArrowFunctionExpression",
            params: [],
            body: {
              type: "AssignmentExpression",
              left: prop,
              operator,
              right: propValue,
            },
            async: false,
            expression: true,
          },
        ],
      },
    } as ESTree.ExpressionStatement);

    isAddedDefaultProps = true;
  }

  return isAddedDefaultProps;
}
