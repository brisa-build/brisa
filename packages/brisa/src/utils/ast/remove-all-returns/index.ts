import type { ESTree } from "meriyah";
import getContentReturns from "../get-content-returns";

export default function removeAllReturns(
  statements: ESTree.Statement[],
): ESTree.Statement[] {
  const returnNode = getContentReturns(statements);

  return JSON.parse(
    JSON.stringify(statements, (k, v) => (returnNode.has(v) ? null : v)),
    (k, v) => {
      if (Array.isArray(v)) return v.filter((v) => v !== null);
      return v;
    },
  );
}
