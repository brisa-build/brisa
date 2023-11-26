import { ESTree } from "meriyah";

const FN_DECLARATORS = new Set(["FunctionDeclaration", "VariableDeclarator"]);

export default function optimizeEffects(
  componentBranch: ESTree.FunctionDeclaration
): ESTree.FunctionDeclaration {
  const webContext = componentBranch.params[1];
  let effectName = "effect";
  let cleanupName = "cleanup";
  let effectIdentifier: string | undefined;
  let identifier: string | undefined;

  if (!webContext) return componentBranch;

  function trackRenamedEffectAndCleanup(
    properties: ESTree.ObjectLiteralElementLike[]
  ) {
    for (let property of properties) {
      if (property.type === "RestElement") {
        identifier = (property as any).argument.name;
        continue;
      }

      const { key, value } = property as ESTree.Property;

      if (key.type !== "Identifier" || value.type !== "Identifier") continue;
      if (key.name === "effect") effectName = value.name;
      if (key.name === "cleanup") cleanupName = value.name;
    }
  }

  if (webContext.type === "ObjectPattern") {
    trackRenamedEffectAndCleanup(webContext.properties);
  } else if (webContext.type === "Identifier") {
    identifier = webContext.name;
  }

  const body = JSON.parse(
    JSON.stringify(componentBranch.body?.body, (key, value) => {
      if (
        value?.type === "VariableDeclaration" &&
        value?.declarations[0]?.id?.type === "ObjectPattern" &&
        identifier === value?.declarations[0]?.init?.name
      ) {
        trackRenamedEffectAndCleanup(value?.declarations[0]?.id?.properties);
      }
      if (
        value?.callee?.name === effectName &&
        value?.arguments?.[0]?.type === "Identifier"
      ) {
        effectIdentifier = value?.arguments?.[0]?.name;
      }
      return value;
    }),
    function (key, value) {
      function transformInnerEffect(effect: ESTree.CallExpression) {
        return JSON.parse(JSON.stringify(effect), (key, innerVal) => {
          if (innerVal?.type !== "CallExpression") return innerVal;
          if (
            innerVal?.callee?.property?.name &&
            innerVal?.callee?.object?.name !== identifier
          ) {
            return innerVal;
          }

          const innerName =
            innerVal?.callee?.name ?? innerVal?.callee?.property?.name;

          if (innerName !== cleanupName) return innerVal;

          // Add 'true' as second parameter to cleanups used inside effects
          return {
            ...innerVal,
            arguments: [
              ...innerVal.arguments,
              { type: "Literal", value: true },
            ],
          };
        });
      }

      if (
        FN_DECLARATORS.has(value?.type) &&
        value?.id?.name === effectIdentifier
      ) {
        return transformInnerEffect(value);
      }
      if (value?.type == !"CallExpression") return value;
      if (
        value?.callee?.property?.name &&
        value?.callee?.object?.name !== identifier
      ) {
        return value;
      }

      const name = value?.callee?.name ?? value?.callee?.property?.name;

      if (name !== effectName) return value;

      return transformInnerEffect(value);
    }
  );

  return {
    ...componentBranch,
    body: {
      ...componentBranch.body,
      body,
    },
  } as ESTree.FunctionDeclaration;
}
