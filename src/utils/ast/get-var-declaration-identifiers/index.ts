import type { ESTree } from "meriyah";

export default function getVarDeclarationIdentifiers(node: ESTree.Node) {
  const identifiers = new Map<string, Set<string>>();

  if (!node) return identifiers;

  function getIdentifiersDependenciesOn(node: ESTree.Node) {
    const deps = new Set<string>();

    JSON.stringify(node, (k, v) => {
      if (v?.type === "Identifier") {
        deps.add(v.name);
        if (identifiers.has(v.name)) {
          for (const dep of identifiers.get(v.name)!) {
            deps.add(dep);
          }
        }
      }

      return v;
    });

    return deps;
  }

  JSON.stringify(node, (k, v) => {
    if (v?.type !== "VariableDeclarator") return v;

    if (v.id.type === "ObjectPattern") {
      for (const property of v.id.properties) {
        identifiers.set(
          property.key.name,
          getIdentifiersDependenciesOn(property.value),
        );
      }
    } else if (v.id.type === "Identifier") {
      identifiers.set(v.id.name, getIdentifiersDependenciesOn(v.init!));
    }

    return v;
  });

  return identifiers;
}
