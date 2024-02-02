import type { ESTree } from "meriyah";

export default function getAllIdentifiers(node?: ESTree.Node) {
  const identifiers = new Set<string>();

  if (!node) return identifiers;

  JSON.stringify(node, (k, v) => {
    if (v?.type === "Identifier") {
      identifiers.add(v.name);
    }

    return v;
  });

  return identifiers;
}
