import { ESTree } from "meriyah";

const NO_REACTIVE_CHILDREN_EXPRESSION = new Set(["Literal", "ArrayExpression"]);

// import {brisaElement} from "brisa/client";
const importDeclaration = {
  type: "ImportDeclaration",
  specifiers: [
    {
      type: "ImportSpecifier",
      imported: {
        type: "Identifier",
        name: "brisaElement",
      },
      local: {
        type: "Identifier",
        name: "brisaElement",
      },
    },
  ],
  source: {
    type: "Literal",
    value: "brisa/client",
  },
} as ESTree.ImportDeclaration;

export default function defineBrisaElement(
  component: ESTree.FunctionDeclaration,
  componentPropsNames: string[],
) {
  const componentParams = component.params;
  const componentBody = component?.body?.body as ESTree.Statement[];
  const [returnWithHyperScript, returnStatementIndex] =
    getReturnStatementWithHyperScript(
      componentBody,
      componentParams,
      componentPropsNames,
    );

  const newComponentBody = componentBody.map((node, index) =>
    index === returnStatementIndex ? returnWithHyperScript : node,
  );

  const newComponentAst = {
    type: "FunctionExpression",
    id: component.id,
    params: componentParams,
    body: {
      type: "BlockStatement",
      body: newComponentBody,
    },
    generator: false,
    async: false,
  };

  declareH(newComponentAst);

  const args = [newComponentAst] as ESTree.Expression[];

  if (componentPropsNames?.length) {
    args.push({
      type: "ArrayExpression",
      elements: componentPropsNames.map((propName: string) => ({
        type: "Literal",
        value: propName,
      })),
    });
  }

  // Wrapping: default export with brisaElement
  const newComponent = {
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: "brisaElement",
    },
    arguments: args,
  };

  return [importDeclaration, newComponent];
}

function getReturnStatementWithHyperScript(
  componentBody: ESTree.Statement[],
  componentParams: ESTree.Parameter[],
  propsNames: string[],
) {
  const returnStatementIndex = componentBody.findIndex(
    (node: any) => node.type === "ReturnStatement",
  );
  const returnStatement = componentBody[returnStatementIndex] as any;
  const [tagName, props, children] = returnStatement?.argument?.elements ?? [];
  const newReturnStatement = {
    type: "ReturnStatement",
    argument: {
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: "h",
      },
      arguments: [
        tagName,
        props,
        convertPropsToReactiveProps(children, componentParams, propsNames),
      ],
    },
  };

  return [newReturnStatement, returnStatementIndex];
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

function convertPropsToReactiveProps(
  children: any,
  componentsParams: ESTree.Parameter[],
  propsNames: string[],
) {
  if (
    !children ||
    !propsNames.length ||
    NO_REACTIVE_CHILDREN_EXPRESSION.has(children.type)
  ) {
    return children;
  }

  const props = componentsParams[0];
  const arrowFn = (body: ESTree.ArrowFunctionExpression["body"]) => ({
    type: "ArrowFunctionExpression",
    expression: true,
    params: [],
    body: body,
  });

  if (propsNames.includes(children?.name)) {
    return arrowFn({
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: children?.name,
      },
      property: {
        type: "Identifier",
        name: "value",
      },
      computed: false,
    });
  }

  if (props.type === "ObjectPattern" && children.type === "Identifier") {
    for (const prop of props.properties) {
      if (prop.value.name === children.name) {
        return arrowFn({
          type: "MemberExpression",
          object: children,
          property: {
            type: "Identifier",
            name: "value",
          },
          computed: false,
        });
      }
    }
  }

  if (
    props.type === "Identifier" &&
    children.object?.type === "Identifier" &&
    props.name === children.object?.name
  ) {
    return arrowFn({
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
    });
  }

  return children;
}
