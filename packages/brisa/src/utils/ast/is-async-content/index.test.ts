import { describe, it, expect } from "bun:test";
import isAsyncContent from ".";
import type { ESTree } from "meriyah";

describe("utils", () => {
  describe("ast", () => {
    describe("is-async-content", () => {
      it("should return true for async content", () => {
        const node = {
          type: "AwaitExpression",
          argument: {
            type: "Identifier",
            name: "foo",
          },
        } as unknown as ESTree.Node;

        expect(isAsyncContent(node)).toBeTrue();
      });

      it("should return false for non-async content", () => {
        const node = {
          type: "Identifier",
          name: "foo",
        } as unknown as ESTree.Node;

        expect(isAsyncContent(node)).toBeFalse();
      });

      it('should return false if the "await" is inside a function call', () => {
        const node = {
          type: "ExpressionStatement",
          expression: {
            type: "ArrowFunctionExpression",
            params: [],
            body: {
              type: "AwaitExpression",
              argument: {
                type: "Identifier",
                name: "foo",
              },
            },
            async: true,
            expression: true,
          },
        } as unknown as ESTree.Node;

        expect(isAsyncContent(node)).toBeFalse();
      });
    });
  });
});
