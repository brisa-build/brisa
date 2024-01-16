import { describe, expect, it } from "bun:test";
import transformToDirectExport from ".";
import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";

const { parseCodeToAST, generateCodeFromAST } = AST();

describe("utils", () => {
  describe("client-build-plugin", () => {
    describe("transform-to-direct-export", () => {
      it('should add an "export default null" if there is no default export', () => {
        const ast = parseCodeToAST(`const MyComponent = () => <div>foo</div>;`);
        const outputAst = transformToDirectExport(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          const MyComponent = () => jsxDEV("div", {children: "foo"}, undefined, false, undefined, this);
          export default null;
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should transform the web-component to a direct export if the component is a variable declaration", () => {
        const ast = parseCodeToAST(`
          const MyComponent = (props) => <div>{props.foo}</div>;
          export default MyComponent;
        `);
        const outputAst = transformToDirectExport(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          export default props => jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should transform the web-component to a direct export if the component is a let variable declaration", () => {
        const ast = parseCodeToAST(`
          let MyComponent
          MyComponent = (props) => <div>{props.foo}</div>;
          export default MyComponent;
        `);
        const outputAst = transformToDirectExport(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          export default props => jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should transform the web-component to a direct export if the component is a let variable declaration + function", () => {
        const ast = parseCodeToAST(`
          let MyComponent
          MyComponent = function (props) { return <div>{props.foo}</div> };
          export default MyComponent;
        `);
        const outputAst = transformToDirectExport(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          export default function (props) {return jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);}
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
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
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
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          export default props => {return jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);};
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should not transform the web-component to a direct export if the component is a direct export", () => {
        const ast = parseCodeToAST(`
          export default (props) => <div>{props.foo}</div>;
        `);
        const outputAst = transformToDirectExport(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          export default props => jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should not transform the web-component to a direct export if the component is a direct export with default props", () => {
        const ast = parseCodeToAST(`
          export default ({ name = "Aral"}) => <div>{name}</div>;
        `);

        const outputAst = transformToDirectExport(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          export default ({name = "Aral"}) => jsxDEV("div", {children: name}, undefined, false, undefined, this);
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
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
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
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          export default function MyComponent(props) {return jsxDEV("div", {children: props.foo}, undefined, false, undefined, this);}
        `);

        expect(outputCode).toBe(expectedCode);
      });
    });
  });
});
