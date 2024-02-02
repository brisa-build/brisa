import type { ESTree } from "meriyah";

export default function getVarDeclarationIdentifiers(node: ESTree.Node) {
  const identifiers = new Set<string>();

  if (!node) return identifiers;

  JSON.stringify(node, (k, v) => {
    if (v?.type === "VariableDeclarator") {
      identifiers.add(v.id.name);
    }
    return v;
  });

  return identifiers;
}
