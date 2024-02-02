import type { ESTree } from "meriyah";

export default function containsIdentifiers(
  node: ESTree.Node,
  identifiers: Set<string>,
) {
  let contains = false;
  JSON.stringify(node, (k, v) => {
    if (v?.type === "Identifier" && identifiers.has(v.name)) {
      contains = true;
    }
    return v;
  });
  return contains;
}
