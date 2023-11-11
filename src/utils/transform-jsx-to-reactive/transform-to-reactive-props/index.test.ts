import { describe, expect, it } from "bun:test";
import AST from "../../ast";
import transformToReactiveProps from ".";

const { parseCodeToAST, generateCodeFromAST } = AST();
const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("transform-to-reactive-props", () => {
      it("should transform all props inside the web-component to reactive props", () => {
        const code = `
          const outsideComponent = (props) => {
            console.log(props.foo);
            if(props.bar) return props.baz;
          }

          export default function InsideWebComoponent(props) {
            console.log(props.foo);
            if(props.bar) return <div>{props.baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames] = transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          const outsideComponent = props => {
            console.log(props.foo);
            if (props.bar) return props.baz;
          };

          export default function InsideWebComoponent(props) {
            console.log(props.foo.value);
            if (props.bar.value) return jsxDEV("div", {children: props.baz.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
      });

      it("should transform all props from destructured props", () => {
        const code = `
          export default function InsideWebComoponent({ foo, bar, baz }) {
            console.log(foo);
            if(bar) return <div>{baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames] = transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function InsideWebComoponent({foo, bar, baz}) {
            console.log(foo.value);
            if (bar.value) return jsxDEV("div", {children: baz.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
      });

      it("should transform all props from renamed destructured props", () => {
        const code = `
          export default function InsideWebComoponent({ foo: foot, bar: bart, baz: bazt }) {
            console.log(foot);
            if(bart) return <div>{bazt}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames] = transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function InsideWebComoponent({foo: foot, bar: bart, baz: bazt}) {
            console.log(foot.value);
            if (bart.value) return jsxDEV("div", {children: bazt.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
      });

      it("should transform all props from destructured props with spread", () => {
        const code = `
          export default function InsideWebComoponent({ foo, ...rest }) {
            console.log(foo);
            if(rest.bar) return <div>{rest.baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames] = transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function InsideWebComoponent({foo, ...rest}) {
            console.log(foo.value);
            if (rest.bar.value) return jsxDEV("div", {children: rest.baz.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
      });

      it("should transform all props from arrow function without block statement", () => {
        const code = `
          export default (props) => console.log(props.foo);
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames] = transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default props => console.log(props.foo.value);
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo"]);
      });

      it("should transform all destructured props from arrow function with block statement", () => {
        const code = `
          export default ({ foo, ...rest }) => foo === "Test" && rest.bar && <div>{rest.baz}</div>;
        `;

        const ast = parseCodeToAST(code);
        const [outputAst, propNames] = transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default ({foo, ...rest}) => foo.value === "Test" && rest.bar.value && jsxDEV("div", {children: rest.baz.value}, undefined, false, undefined, this);
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
      });
    });
  });
});
