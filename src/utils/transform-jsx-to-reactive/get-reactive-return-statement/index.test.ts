import { describe, expect, it } from "bun:test";
import { ESTree } from "meriyah";
import getReactiveReturnStatement from ".";
import { normalizeQuotes } from "../../../helpers";
import AST from "../../ast";

const { parseCodeToAST, generateCodeFromAST } = AST();

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("get-reactive-return-statement", () => {
      it("should return the reactive return statement", () => {
        const program = parseCodeToAST(`
          const a = (props) => ['div', { foo: () => props.bar.value }, 'baz']
        `) as any;

        const component = program.body[0].declarations[0]
          .init as ESTree.FunctionDeclaration;

        const output = getReactiveReturnStatement(component, "a");

        const expectedCode = normalizeQuotes(
          `function a(props) {return ['div', {foo: () => props.bar.value}, 'baz'];}`,
        );

        expect(normalizeQuotes(generateCodeFromAST(output as any))).toBe(
          expectedCode,
        );
      });

      it("should be reactive returning a variable", () => {
        const program = parseCodeToAST(`
          const a = (props) => {
            const foo = ['b', {}, () => props.bar.value];
            return foo;
          }
        `) as any;

        const component = program.body[0].declarations[0]
          .init as ESTree.FunctionDeclaration;
        const output = getReactiveReturnStatement(component, "a");
        const expectedCode = normalizeQuotes(`
          function a(props) {
            const foo = ['b', {}, () => props.bar.value];
            return () => foo;
          }
        `);

        expect(normalizeQuotes(generateCodeFromAST(output as any))).toBe(
          expectedCode,
        );
      });
    });
  });
});
