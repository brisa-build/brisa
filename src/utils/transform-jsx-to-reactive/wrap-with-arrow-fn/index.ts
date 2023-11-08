import { ESTree } from "meriyah";

export default function wrapWithArrowFn(node: ESTree.Node) {
  return {
    type: "ArrowFunctionExpression",
    expression: true,
    params: [],
    body: node,
  } as unknown as ESTree.ArrowFunctionExpression;
}
