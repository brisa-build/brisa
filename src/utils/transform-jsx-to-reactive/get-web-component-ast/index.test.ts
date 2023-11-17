import { describe, expect, it } from "bun:test";
import AST from "../../ast";
import getWebComponentAst from ".";
import { ESTree } from "meriyah";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("get-web-component-ast", () => {
      it("should not return the web component if there are no default export", () => {
        const input = parseCodeToAST(`
          export function MyComponent() {
            return <div>foo</div>
          }
        `);
        const [ast, index] = getWebComponentAst(input);
        expect(ast).toEqual(null);
        expect(index).not.toBeDefined();
      });
      it("should return the web component subtree", () => {
        const input = parseCodeToAST(`
          const anotherContent = true;

          export default function MyComponent() {
            return <div>foo</div>
          }
        `);
        const [ast, index] = getWebComponentAst(input);
        const output = toInline(
          generateCodeFromAST(ast as unknown as ESTree.Program)
        );
        const expected = toInline(`
          function MyComponent() {
            return jsxDEV("div", {children: "foo"}, undefined, false, undefined, this);
          }
        `);
        expect(output).toEqual(expected);
        expect(index).toBe(1);
      });

      it("should return the web component subtree when the default export is from a variable", () => {
        const input = parseCodeToAST(`
          const anotherContent = true;

          function MyComponent() {
            return <div>foo</div>
          }

          export default MyComponent;
        `);
        const [astOutput, index] = getWebComponentAst(input);
        const codeOutput = toInline(
          generateCodeFromAST(astOutput as unknown as ESTree.Program)
        );
        const expected = toInline(`
          let MyComponent = function () {
            return jsxDEV("div", {children: "foo"}, undefined, false, undefined, this);
          };
        `);
        expect(codeOutput).toEqual(expected);
        expect(index).toBe(2);
      });

      it("should return the web component subtree when the component is an arrow function", () => {
        const input = parseCodeToAST(`
          const anotherContent = true;

          export default () => <div>foo</div>;
        `);
        const [astOutput, index] = getWebComponentAst(input);
        const codeOutput = toInline(
          generateCodeFromAST(astOutput as unknown as ESTree.Program)
        );
        const expected = toInline(`
          () => jsxDEV("div", {children: "foo"}, undefined, false, undefined, this)
        `);
        expect(codeOutput).toEqual(expected);
        expect(index).toBe(1);
      });

      it("should return the web component subtree when the component is an arrow function with props", () => {
        const input = parseCodeToAST(`
          const anotherContent = true;

          export default (props) => <div>{props.someProp}</div>;
        `);
        const [astOutput, index] = getWebComponentAst(input);
        const codeOutput = toInline(
          generateCodeFromAST(astOutput as unknown as ESTree.Program)
        );
        const expected = toInline(`
          props => jsxDEV("div", {children: props.someProp}, undefined, false, undefined, this)
        `);

        expect(codeOutput).toEqual(expected);
        expect(index).toBe(1);
      });

      it("should return the web component subtree when the component is an arrow function and the default export is from a variable", () => {
        const input = parseCodeToAST(`
          const anotherContent = true;

          const MyComponent = () => <div>foo</div>;

          export default MyComponent;
        `);
        const [astOutput, index] = getWebComponentAst(input);
        const codeOutput = toInline(
          generateCodeFromAST(astOutput as unknown as ESTree.Program)
        );
        const expected = toInline(`
          const MyComponent = () => jsxDEV("div", {children: "foo"}, undefined, false, undefined, this);
        `);
        expect(codeOutput).toEqual(expected);
        expect(index).toBe(2);
      });
    });
  });
});
