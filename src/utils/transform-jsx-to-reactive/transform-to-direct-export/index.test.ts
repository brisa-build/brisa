import { describe, expect, it } from "bun:test";
import AST from "../../ast";
import transformToDirectExport from ".";

const { parseCodeToAST, generateCodeFromAST } = AST();
const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("transform-to-direct-export", () => {
      it("should transform the web-component to a direct export if the component is a variable declaration", () => {
        const ast = parseCodeToAST(`
          const MyComponent = (props) => <div>{props.foo}</div>;
          export default MyComponent;
        `);
        const outputAst = transformToDirectExport(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));
        const expectedCode = toInline(`
          export default props => jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should transform the web-component to a direct export if the component is a function declaration", () => {
        const ast = parseCodeToAST(`
          function MyComponent(props) {
            return <div>{props.foo}</div>;
          }
          export default MyComponent;
        `);
        const outputAst = transformToDirectExport(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));
        const expectedCode = toInline(`
          export default function (props) {return jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);}
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should transform the web-component to a direct export if the component is an arrow function with block statement declaration", () => {
        const ast = parseCodeToAST(`
          const MyComponent = (props) => {
            return <div>{props.foo}</div>;
          }
          export default MyComponent;
        `);
        const outputAst = transformToDirectExport(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));
        const expectedCode = toInline(`
          export default props => {return jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);};
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should not transform the web-component to a direct export if the component is a direct export", () => {
        const ast = parseCodeToAST(`
          export default (props) => <div>{props.foo}</div>;
        `);
        const outputAst = transformToDirectExport(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));
        const expectedCode = toInline(`
          export default props => jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should not transform the web-component to a direct export if the component is a direct export with block statement", () => {
        const ast = parseCodeToAST(`
          export default (props) => {
            return <div>{props.foo}</div>;
          }
        `);
        const outputAst = transformToDirectExport(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));
        const expectedCode = toInline(`
          export default props => {return jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);};
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should not transform the web-component to a direct export if the component is a direct export with a function declaration", () => {
        const ast = parseCodeToAST(`
          export default function MyComponent(props) {
            return <div>{props.foo}</div>;
          }
        `);
        const outputAst = transformToDirectExport(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));
        const expectedCode = toInline(`
          export default function MyComponent(props) {return jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);}
        `);

        expect(outputCode).toBe(expectedCode);
      });
    });
  });
});
