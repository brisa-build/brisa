import { ESTree } from "meriyah";
import AST from "../ast";

// TSX loader also works for JSX/TS/JS
const loader = "tsx";
const { parseCodeToAST, generateCodeFromAST } = AST(loader);
const WEB_COMPONENT_REGEX = new RegExp(".*/web-components/.*");
const ALTERNATIVE_FOLDER_REGEX = new RegExp(".*/web-components/@.*?/");
const JSX_NAME = new Set(["jsx", "jsxDEV"]);

/**
 * jsxToReactiveHyperscript
 *
 * @description This code transform web-components jsx to reactive-hyperscript in build time.
 * @returns string
 */
export default function jsxToReactiveHyperscript(
  code: string,
  path: string,
): string {
  if (path.match(ALTERNATIVE_FOLDER_REGEX)) return code;

  const ast = parseCodeToAST(code);
  const astWithoutJSX = replaceJSXToArray(ast);

  if (!path.match(WEB_COMPONENT_REGEX))
    return generateCodeFromAST(astWithoutJSX);

  const exportDefault = astWithoutJSX.body.find(
    (node) => node.type === "ExportDefaultDeclaration",
  ) as ESTree.ExportDefaultDeclaration | undefined;

  if (!exportDefault) return generateCodeFromAST(astWithoutJSX);

  const componentAST = exportDefault.declaration as any;

  if (componentAST.type !== "FunctionDeclaration")
    return generateCodeFromAST(astWithoutJSX);

  declareH(componentAST);
  convertFirstArrayFromReturnToHyperScript(exportDefault);

  return generateCodeFromAST(astWithoutJSX);
}

function replaceJSXToArray(ast: ESTree.Program): ESTree.Program {
  return JSON.parse(JSON.stringify(ast), (key, value) => {
    if (
      value?.type !== "CallExpression" ||
      !JSX_NAME.has(value?.callee?.name ?? "")
    )
      return value;

    const tagName = value.arguments[0].value;
    const props = value.arguments[1].properties;
    const childrenIndex = props.findIndex(
      (prop: any) => prop.key.name === "children",
    );
    const children = props[childrenIndex]?.value ?? [];
    const restOfProps = props.filter(
      (prop: any, index: number) => index !== childrenIndex,
    );

    return {
      type: "ArrayExpression",
      elements: [
        {
          type: "Literal",
          value: tagName,
        },
        {
          type: "ObjectExpression",
          properties: restOfProps,
        },
        children,
      ],
    };
  });
}

function declareH(componentAST: any) {
  if (!componentAST.params.length) {
    componentAST.params.push({
      type: "ObjectPattern",
      properties: [],
    });
  }

  componentAST.params.push({
    type: "ObjectPattern",
    properties: [
      {
        type: "Property",
        key: {
          type: "Identifier",
          name: "h",
        },
        value: {
          type: "Identifier",
          name: "h",
        },
        kind: "init",
        computed: false,
        method: false,
        shorthand: true,
      },
    ],
  });
}

function convertFirstArrayFromReturnToHyperScript(
  defaultExport: ESTree.ExportDefaultDeclaration,
) {
  const component = defaultExport.declaration as any;
  const returnStatement = component.body.body.find(
    (node: any) => node.type === "ReturnStatement",
  );
  const [tagName, props, children] = returnStatement?.argument?.elements ?? [];

  returnStatement.argument = {
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: "h",
    },
    arguments: [tagName, props, wrapSignalsWithFn(children, component.params)],
  };
}

function wrapSignalsWithFn(children: any, params: any[]) {
  if (!children || !params.length || children.type === "Literal")
    return children;

  const [props] = params;
  let newChildren = children;

  if (
    props.type === "Identifier" &&
    children.object?.type === "Identifier" &&
    props.name === children.object?.name
  ) {
    newChildren = {
      type: "MemberExpression",
      object: {
        type: "MemberExpression",
        object: props,
        property: {
          type: "Identifier",
          name: "someProp",
        },
        computed: false,
      },
      property: {
        type: "Identifier",
        name: "value",
      },
      computed: false,
    };
  }

  return {
    type: "ArrowFunctionExpression",
    expression: true,
    params: [],
    body: newChildren,
  };
}
