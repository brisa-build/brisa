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

          export default function Component(props) {
            console.log(props.foo);
            if(props.bar) return <div>{props.baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          const outsideComponent = props => {
            console.log(props.foo);
            if (props.bar) return props.baz;
          };

          export default function Component(props) {
            console.log(props.foo.value);
            if (props.bar.value) return jsxDEV("div", {children: props.baz.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform all props from destructured props", () => {
        const code = `
          export default function Component({ foo, bar, baz }) {
            console.log(foo);
            if(bar) return <div>{baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component({foo, bar, baz}) {
            console.log(foo.value);
            if (bar.value) return jsxDEV("div", {children: baz.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform all props from renamed destructured props", () => {
        const code = `
          export default function Component({ foo: foot, bar: bart, baz: bazt }) {
            console.log(foot);
            if(bart) return <div>{bazt}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component({foo: foot, bar: bart, baz: bazt}) {
            console.log(foot.value);
            if (bart.value) return jsxDEV("div", {children: bazt.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform all props from destructured props with spread", () => {
        const code = `
          export default function Component({ foo, ...rest }) {
            console.log(foo);
            if(rest.bar) return <div>{rest.baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component({foo, ...rest}) {
            console.log(foo.value);
            if (rest.bar.value) return jsxDEV("div", {children: rest.baz.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform all props from arrow function without block statement", () => {
        const code = `
          export default (props) => console.log(props.foo);
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default props => console.log(props.foo.value);
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform all destructured props from arrow function with block statement", () => {
        const code = `
          export default ({ foo, ...rest }) => foo === "Test" && rest.bar && <div>{rest.baz}</div>;
        `;

        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default ({foo, ...rest}) => foo.value === "Test" && rest.bar.value && jsxDEV("div", {children: rest.baz.value}, undefined, false, undefined, this);
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform all renamed props via variable declaration", () => {
        const code = `
          export default function Component(props) {
            const foot = props.foo;
            const bart = props.bar;
            const bazt = props.baz;
            console.log(foot);
            if(bart) return <div>{bazt}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component(props) {
            const foot = props.foo;
            const bart = props.bar;
            const bazt = props.baz;
            console.log(foot.value);
            if (bart.value) return jsxDEV("div", {children: bazt.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform all renamed props via variable declaration and destructuring", () => {
        const code = `
          export default function Component(props) {
            const { foo: foot, bar: bart, baz: bazt } = props;
            console.log(foot);
            if(bart) return <div>{bazt}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component(props) {
            const {foo: foot, bar: bart, baz: bazt} = props;
            console.log(foot.value);
            if (bart.value) return jsxDEV("div", {children: bazt.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should work consuming a property of some props", () => {
        const code = `
          const outsideComponent = (props) => {
            console.log(props.foo.name);
            if(props.bar.name) return props.baz.name;
          }

          export default function Component(props) {
            console.log(props.foo.name);
            if(props.bar?.name) return <div>{props.baz.name}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          const outsideComponent = props => {
            console.log(props.foo.name);
            if (props.bar.name) return props.baz.name;
          };

          export default function Component(props) {
            console.log(props.foo.value.name);
            if (props.bar.value?.name) return jsxDEV("div", {children: props.baz.value.name}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should not add .value inside an attribute key, only in the value", () => {
        const code = `
          export default function Component({foo, bar}) {
            return <div foo={bar}>test</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);

        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component({foo, bar}) {
            return jsxDEV("div", {foo: bar.value,children: "test"}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should remove the default props from params and add them to the component body", () => {
        const code = `
          export default function Component({ foo, bar = "bar", baz = "baz" }) {
            return <div>{foo}{bar}{baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);

        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component({foo, bar, baz}) {
            effect(() => baz.value ??= 'baz');
            effect(() => bar.value ??= 'bar');
            return jsxDEV("div", {children: [foo.value, bar.value, baz.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar", "baz"]);
        expect(isAddedDefaultProps).toBe(true);
      });

      it("should not transform to reactive if the prop name is children", () => {
        const code = `
          export default function Component({ children }) {
            return <div>{children}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);

        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component({children}) {
            return jsxDEV("div", {children}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual([]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform to reactive if some another prop is renamed to children", () => {
        const code = `
          export default function Component({ foo, bar: children }) {
            return <div>{foo}{children}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);

        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component({foo, bar: children}) {
            return jsxDEV("div", {children: [foo.value, children.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo", "bar"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform to reactive if is used inside a function call with a object expression", () => {
        const code = `
          const bar = (props) => <div>{props.baz}</div>;
          export default function Component({ foo }) {
            return <div>{bar({ foo })}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          const bar = props => jsxDEV("div", {children: props.baz}, undefined, false, undefined, this);
          export default function Component({foo}) {
            return jsxDEV("div", {children: bar({foo: foo.value})}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should not transform to reactive the props that are events", () => {
        const code = `
          export default function Component(props) {
            const { onClick, ...rest } = props;
            return <div onClick={onClick}><div onClick={rest.onClickSpan}>Click</div></div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component(props) {
            const {onClick, ...rest} = props;
            return jsxDEV("div", {onClick,children: jsxDEV("div", {onClick: rest.onClickSpan,children: "Click"}, undefined, false, undefined, this)}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["onClick", "onClickSpan"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform props consumed in an expression inside an attribute value", () => {
        const code = `
            type RuntimeLogProps = {
              error: { stack: string, message: string };
              warning: string;
            }
            
            export default function RuntimeLog({ error, warning }: RuntimeLogProps) {
              return (
                <dialog open={error || warning}>
                  {error && \`Error: \${error.message}\`}
                  {error && <pre>{error.stack}</pre>}
                  {warning && \`Warning: \${warning}\`}
                </dialog>
              )
            }      
          `;

        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
            export default function RuntimeLog({error, warning}) {
              return jsxDEV("dialog", {open: error.value || warning.value,children: [error.value && \`Error: \${error.value.message}\`, error.value && jsxDEV("pre", {children: error.value.stack}, undefined, false, undefined, this), warning.value && \`Warning: \${warning.value}\`]}, undefined, true, undefined, this);
            }
          `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["error", "warning"]);
        expect(isAddedDefaultProps).toBe(false);
      });

      it("should transform a default prop declaration inside the body of the component", () => {
        const code = `
          export default function Component({ foo }) {
            const bar = foo ?? "bar";
            return <div>{bar}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const [outputAst, propNames, isAddedDefaultProps] =
          transformToReactiveProps(ast);
        const outputCode = toInline(generateCodeFromAST(outputAst));

        const expectedCode = toInline(`
          export default function Component({foo}) {
            effect(() => foo.value ??= 'bar');
            const bar = foo;
            return jsxDEV("div", {children: bar.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(propNames).toEqual(["foo"]);
        expect(isAddedDefaultProps).toBe(true);
      });
    });
  });
});
