import { describe, expect, it } from "bun:test";
import getReactiveReturnStatement from ".";
import { ESTree } from "meriyah";
import AST from "../../ast";

const { parseCodeToAST, generateCodeFromAST } = AST();
const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("get-reactive-return-statement", () => {
      it("should return the reactive return statement", () => {
        const componentBody = parseCodeToAST(`
          const a = (props) => ['div', { foo: props.bar }, 'baz']
        `).body as ESTree.Statement[];

        const componentParams: ESTree.Parameter[] = [
          {
            type: "Identifier",
            name: "props",
          },
        ];

        const propsNames = ["bar"];

        const output = getReactiveReturnStatement(
          componentBody,
          componentParams,
          propsNames,
          "h",
        );

        const expectedIndex = -1;
        const expectedCode = toInline(
          `return h('div', {foo: () => props.bar.value}, 'baz');`,
        );

        expect(toInline(generateCodeFromAST(output[0] as any))).toBe(
          expectedCode,
        );
        expect(output[1]).toBe(expectedIndex);
      });
    });
  });
});
