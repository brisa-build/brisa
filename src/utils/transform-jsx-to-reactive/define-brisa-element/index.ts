import { ESTree } from "meriyah";
import { BRISA_IMPORT } from "../constants";
import getReactiveReturnStatement from "../get-reactive-return-statement";
import manageWebContextField from "../manage-web-context-field";

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

  const effectVarName = isAddedDefaultProps
    ? generateUniqueVariableName("effect", allVariableNames)
    : undefined;
  const componentName = generateUniqueVariableName(
    component.id?.name ?? "Component",
    allVariableNames
  );

  const [reactiveReturn, indexReturn] =
    getReactiveReturnStatement(componentBody);

  const newComponentBody = componentBody.map((node, index) =>
    index === indexReturn ? reactiveReturn : node
  );

  const newComponentAst = {
    type: "FunctionExpression",
    id: {
      type: "Identifier",
      name: componentName,
    },
    params: componentParams,
    body: {
      type: "BlockStatement",
      body: newComponentBody,
    },
    generator: component.generator,
    async: component.async,
  };

  // Note:
  // this is necessary because for the default props like:
  //   export default function Component({ propName = 'default value' }) {}
  // the compiler will add an "effect" to use the default value if the prop is not passed
  if (effectVarName) {
    manageWebContextField(newComponentAst, effectVarName, "effect");
  }

  // Add an identifier to the component
  const args = [
    { type: "Identifier", name: componentName },
  ] as ESTree.Expression[];

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
  const brisaElement = {
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: "brisaElement",
    },
    arguments: args,
  };

  return [BRISA_IMPORT, brisaElement, newComponentAst];
}

function wrapWithReturnStatement(statement: ESTree.Statement) {
  return {
    type: "ReturnStatement",
    argument: statement,
  };
}

function generateUniqueVariableName(
  baseName: string,
  existingNames: Set<string>
): string {
  let uniqueName = baseName;
  while (existingNames.has(uniqueName)) {
    uniqueName += "$";
  }
  return uniqueName;
}
