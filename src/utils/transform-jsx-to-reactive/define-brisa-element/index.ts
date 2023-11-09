import { ESTree } from "meriyah";
import { BRISA_IMPORT } from "../constants";
import getReactiveReturnStatement from "../get-reactive-return-statement";

export default function defineBrisaElement(
  component: ESTree.FunctionDeclaration,
  componentPropsNames: string[],
  hyperScriptVarName: string = "h",
) {
  const componentParams = component.params;
  const componentBody = (component.body?.body ?? [
    wrapWithReturnStatement(component.body as ESTree.Statement),
  ]) as ESTree.Statement[];

  const [returnWithHyperScript, returnStatementIndex] =
    getReactiveReturnStatement(
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
    generator: component.generator,
    async: component.async,
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
  if (!componentAST.params?.length) {
    componentAST.params.push({
      type: "ObjectPattern",
      properties: [],
    });
  }

  // convert function ({}) {} to function ({}, { h }) {}
  if (componentAST.params?.length === 1) {
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

function wrapWithReturnStatement(statement: ESTree.Statement) {
  return {
    type: "ReturnStatement",
    argument: statement,
  };
}
