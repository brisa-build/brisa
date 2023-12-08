import { ESTree } from "meriyah";
import { BRISA_IMPORT } from "../constants";
import getReactiveReturnStatement from "../get-reactive-return-statement";

export default function defineBrisaElement(
  component: ESTree.FunctionDeclaration,
  componentPropsNames: string[],
  allVariableNames: Set<string> = new Set(),
  isAddedDefaultProps?: boolean
) {
  const componentParams = component.params;
  const componentBody = (component.body?.body ?? [
    wrapWithReturnStatement(component.body as ESTree.Statement),
  ]) as ESTree.Statement[];

  let hyperScriptVarName = "h";
  let effectVarName = isAddedDefaultProps ? "effect" : undefined;

  while (allVariableNames.has(hyperScriptVarName)) hyperScriptVarName += "$";
  if (effectVarName) {
    while (allVariableNames.has(effectVarName)) effectVarName += "$";
  }

  const [returnWithHyperScript, returnStatementIndex] =
    getReactiveReturnStatement(componentBody, hyperScriptVarName);

  const newComponentBody = componentBody.map((node, index) =>
    index === returnStatementIndex ? returnWithHyperScript : node
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

  manageWebContextField(newComponentAst, hyperScriptVarName, "h");

  // Note:
  // this is necessary because for the default props like:
  //   export default function Component({ propName = 'default value' }) {}
  // the compiler will add an "effect" to use the default value if the prop is not passed
  if (effectVarName) {
    manageWebContextField(newComponentAst, effectVarName, "effect");
  }

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

function manageWebContextField(
  componentAST: any,
  fieldName: string,
  originalFieldName: string
) {
  const property = {
    type: "Property",
    key: {
      type: "Identifier",
      name: originalFieldName,
    },
    value: {
      type: "Identifier",
      name: fieldName,
    },
    kind: "init",
    computed: false,
    method: false,
    shorthand: fieldName === originalFieldName,
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
      properties: [property],
    });
  }
  // convert function ({}, { state }) {} to function ({}, { state, h }) {}
  else if (componentAST.params[1]?.type === "ObjectPattern") {
    const existH = componentAST.params[1].properties.some(
      (prop: any) => prop.key.name === originalFieldName
    );
    if (!existH) componentAST.params[1].properties.push(property);
  }
  // convert function ({}, context) {} to function ({ h, ...context }) {}
  else if (componentAST.params[1]?.type === "Identifier") {
    const props = componentAST.params[1];
    componentAST.params[1] = {
      type: "ObjectPattern",
      properties: [
        property,
        {
          type: "RestElement",
          argument: props,
        },
      ],
    };
  }

  // Replace all introduced effect calls by the compiler with the new field name (effect -> effect$)
  // these cases are rare, but they can happen when the user uses some variable named "effect"
  if (originalFieldName === "effect" && originalFieldName !== fieldName) {
    for (let statement of componentAST.body.body) {
      if (statement.isEffect) {
        statement.expression.callee.name = fieldName;
      }
    }
  }
}

function wrapWithReturnStatement(statement: ESTree.Statement) {
  return {
    type: "ReturnStatement",
    argument: statement,
  };
}
