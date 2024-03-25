import isAsyncContent from "@/utils/ast/is-async-content";
import { ESTree } from "meriyah";

export default function wrapWithArrowFn(node: ESTree.Node) {
  return {
    type: "ArrowFunctionExpression",
    expression: true,
    async: isAsyncContent(node),
    params: [],
    body: node,
  } as unknown as ESTree.ArrowFunctionExpression;
}
