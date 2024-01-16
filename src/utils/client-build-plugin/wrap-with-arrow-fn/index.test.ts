import { describe, expect, it } from "bun:test";
import wrapWithArrowFn from ".";
import { ESTree } from "meriyah";

describe("utils", () => {
  describe("client-build-plugin", () => {
    describe("wrap-with-arrow-fn", () => {
      it("should wrap the node with an arrow function", () => {
        const node = {
          type: "Literal",
          value: "foo",
        };
        const output = wrapWithArrowFn(node as unknown as ESTree.Node);
        const expected = {
          type: "ArrowFunctionExpression",
          expression: true,
          params: [],
          body: node,
        } as unknown as ESTree.ArrowFunctionExpression;

        expect(output).toEqual(expected);
      });
    });
  });
});
