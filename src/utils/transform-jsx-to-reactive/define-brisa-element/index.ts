import { ESTree } from "meriyah";
import { BRISA_IMPORT, NO_REACTIVE_CHILDREN_EXPRESSION } from "../constants";
import wrapWithArrowFn from "../wrap-with-arrow-fn";

export default function defineBrisaElement(
  component: ESTree.FunctionDeclaration,
  componentPropsNames: string[],
  hyperScriptVarName: string = "h",
) {
  const componentParams = component.params;
  const componentBody = component?.body?.body as ESTree.Statement[];
  const [returnWithHyperScript, returnStatementIndex] =
    getReturnStatementWithHyperScript(
      componentBody,
      componentParams,
      componentPropsNames,
      hyperScriptVarName,
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

  declareH(newComponentAst, hyperScriptVarName);

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

  return [BRISA_IMPORT, newComponent];
}

function getReturnStatementWithHyperScript(
  componentBody: ESTree.Statement[],
  componentParams: ESTree.Parameter[],
  propsNames: string[],
  hyperScriptVarName: string,
) {
  const returnStatementIndex = componentBody.findIndex(
    (node: any) => node.type === "ReturnStatement",
  );
  const returnStatement = componentBody[returnStatementIndex] as any;
  let [tagName, props, children] = returnStatement?.argument?.elements ?? [];
  let componentChildren = convertPropsToReactiveProps(
    children,
    componentParams,
    propsNames,
  );

  // Cases that the component return a literal, ex: return "foo"
  if (
    !tagName &&
    !props &&
    !componentChildren &&
    returnStatement?.argument?.type === "Literal"
  ) {
    (tagName = {
      type: "Literal",
      value: null,
    }),
      (props = {
        type: "ObjectExpression",
        properties: [],
      });
    componentChildren = returnStatement?.argument;
  }

  const newReturnStatement = {
    type: "ReturnStatement",
    argument: {
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: hyperScriptVarName,
      },
      arguments: [
        tagName,
        props,
        convertPropsToReactivePropsForInnerTags(
          componentChildren,
          componentParams,
          propsNames,
        ),
      ],
    },
  };

  return [newReturnStatement, returnStatementIndex];
}

function declareH(componentAST: any, hyperScriptVarName: string) {
  const hProperty = {
    type: "Property",
    key: {
      type: "Identifier",
      name: "h",
    },
    value: {
      type: "Identifier",
      name: hyperScriptVarName,
    },
    kind: "init",
    computed: false,
    method: false,
    shorthand: hyperScriptVarName === "h",
  };

  // convert function () {} to function ({}) {}
  if (!componentAST.params.length) {
    componentAST.params.push({
      type: "ObjectPattern",
      properties: [],
    });
  }

  // convert function ({}) {} to function ({}, { h }) {}
  if (componentAST.params.length === 1) {
    componentAST.params.push({
      type: "ObjectPattern",
      properties: [hProperty],
    });
  }
  // convert function ({}, { state }) {} to function ({}, { state, h }) {}
  else if (componentAST.params[1]?.type === "ObjectPattern") {
    componentAST.params[1].properties.push(hProperty);
  }
  // convert function ({}, context) {} to function ({ h, ...context }) {}
  else if (componentAST.params[1]?.type === "Identifier") {
    const props = componentAST.params[1];
    componentAST.params[1] = {
      type: "ObjectPattern",
      properties: [
        hProperty,
        {
          type: "RestElement",
          argument: props,
        },
      ],
    };
  }
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

  if (propsNames.includes(children?.name)) {
    return wrapWithArrowFn({
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
        return wrapWithArrowFn({
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
    return wrapWithArrowFn({
      type: "MemberExpression",
      object: {
        type: "MemberExpression",
        object: props,
        property: {
          type: "Identifier",
          name: children.property?.name,
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

function convertPropsToReactivePropsForInnerTags(
  children: any,
  componentsParams: ESTree.Parameter[],
  propsNames: string[],
) {
  if (!children) return children;

  return JSON.parse(JSON.stringify(children), (key, value) => {
    if (
      value?.type === "ArrayExpression" &&
      value?.elements?.length === 3 &&
      !Array.isArray(value?.elements[0])
    ) {
      value.elements[2] = convertPropsToReactiveProps(
        value.elements[2],
        componentsParams,
        propsNames,
      );
    }
    return value;
  });
}
