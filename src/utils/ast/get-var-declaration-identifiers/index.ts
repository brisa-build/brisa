import type { ESTree } from "meriyah";

export default function getVarDeclarationIdentifiers(node: ESTree.Node) {
  const identifiers = new Set<string>();

  if (!node) return identifiers;

  JSON.stringify(node, (k, v) => {
    if (v?.type !== "VariableDeclarator") return v;

    if (v.id.type === "ObjectPattern") {
      for (const property of v.id.properties) {
        identifiers.add(property.key.name);
      }
    } else if (v.id.type === "Identifier") {
      identifiers.add(v.id.name);
    }

    return v;
  });

  return identifiers;
}
