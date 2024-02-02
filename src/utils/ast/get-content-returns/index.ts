import type { ESTree } from "meriyah";

export default function getContentReturns(
  statements: ESTree.Statement[],
): Set<ESTree.Node> {
  const returns = new Set<ESTree.Node>();

  JSON.stringify(statements, (k, v) => {
    if (v?.type === "CallExpression") return null;
    if (v?.type === "ReturnStatement") {
      returns.add(v);
    }
    return v;
  });

  return returns;
}
