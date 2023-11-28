import { ESTree } from "meriyah";

const FN_DECLARATORS = new Set(["FunctionDeclaration", "VariableDeclarator"]);

export default function optimizeEffects(
  componentBranch: ESTree.FunctionDeclaration,
  allVariableNames = new Set<string>()
): ESTree.FunctionDeclaration {
  const webContext = componentBranch.params[1];
  let effectName = "effect";
  let cleanupName = "cleanup";
  let effectIdentifier: string | undefined;
  let identifier: string | undefined;
  let r = "r";

  while (allVariableNames.has(r)) r += "$";

  if (!webContext) return componentBranch;

  function trackEffectAndCleanup(
    properties: ESTree.ObjectLiteralElementLike[]
  ) {
    let result = false;

    for (let property of properties) {
      if (property.type === "RestElement") {
        identifier = (property as any).argument.name;
        result = true;
        continue;
      }

      const { key, value } = property as ESTree.Property;

      if (key.type !== "Identifier" || value.type !== "Identifier") continue;
      if (key.name === "effect") {
        effectName = value.name;
        result = true;
      }
      if (key.name === "cleanup") {
        cleanupName = value.name;
        result = true;
      }
    }

    return result;
  }

  if (webContext.type === "ObjectPattern") {
    const changed = trackEffectAndCleanup(webContext.properties);
    if (!changed) return componentBranch;
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
        trackEffectAndCleanup(value?.declarations[0]?.id?.properties);
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
      function transformInnerEffect(effect: any) {
        let modified = false;
        let rName =
          effect?.init?.params?.[0]?.name ??
          effect?.arguments?.[0]?.params?.[0]?.name ??
          r;

        const modifiedEffect = JSON.parse(
          JSON.stringify(effect),
          (key, innerVal) => {
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

            // Add 'r.id' as second parameter to cleanups used inside effects
            modified = true;
            const arg = {
              type: "MemberExpression",
              object: { type: "Identifier", name: rName },
              property: { type: "Identifier", name: "id" },
              computed: false,
            };

            return {
              ...innerVal,
              arguments: [innerVal.arguments[0], arg],
            };
          }
        );

        if (modified) {
          const param = {
            type: "Identifier",
            name: rName,
          };

          if (modifiedEffect?.init) {
            modifiedEffect.init.params = [param];
          } else if (modifiedEffect?.arguments) {
            modifiedEffect.arguments[0].params = [param];
          }
        }

        return modifiedEffect;
      }

      if (
        FN_DECLARATORS.has(value?.type) &&
        value?.id?.name === effectIdentifier
      ) {
        return transformInnerEffect(value);
      }
      if (value?.type !== "CallExpression") return value;
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
