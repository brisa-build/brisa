import { describe, expect, it } from "bun:test";
import transformToReactiveProps from ".";
import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";

const { parseCodeToAST, generateCodeFromAST } = AST();

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
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
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
        expect(out.props).toEqual(["foo", "bar", "baz"]);
        expect(out.vars).toEqual(
          new Set(["foo", "bar", "baz", "console", "props"]),
        );
      });

      it("should transform all props from destructured props", () => {
        const code = `
          export default function Component({ foo, bar, baz }) {
            console.log(foo);
            if(bar) return <div>{baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component({foo, bar, baz}) {
            console.log(foo.value);
            if (bar.value) return jsxDEV("div", {children: baz.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo", "bar", "baz"]);
        expect(out.vars).toEqual(new Set(["foo", "bar", "baz", "console"]));
      });

      it("should transform all props from renamed destructured props", () => {
        const code = `
          export default function Component({ foo: foot, bar: bart, baz: bazt }) {
            console.log(foot);
            if(bart) return <div>{bazt}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component({foo: foot, bar: bart, baz: bazt}) {
            console.log(foot.value);
            if (bart.value) return jsxDEV("div", {children: bazt.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo", "bar", "baz"]);
        expect(out.vars).toEqual(new Set(["foo", "bar", "baz", "console"]));
      });

      it("should transform all props from destructured props with spread", () => {
        const code = `
          export default function Component({ foo, ...rest }) {
            console.log(foo);
            if(rest.bar) return <div>{rest.baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component({foo, ...rest}) {
            console.log(foo.value);
            if (rest.bar.value) return jsxDEV("div", {children: rest.baz.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo", "bar", "baz"]);
        expect(out.vars).toEqual(
          new Set(["foo", "bar", "baz", "console", "rest"]),
        );
      });

      it("should transform all props from arrow function without block statement", () => {
        const code = `
          export default (props) => console.log(props.foo);
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default props => console.log(props.foo.value);
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo"]);
        expect(out.vars).toEqual(new Set(["foo", "console", "props"]));
      });

      it("should transform all destructured props from arrow function with block statement", () => {
        const code = `
          export default ({ foo, ...rest }) => foo === "Test" && rest.bar && <div>{rest.baz}</div>;
        `;

        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default ({foo, ...rest}) => foo.value === "Test" && rest.bar.value && jsxDEV("div", {children: rest.baz.value}, undefined, false, undefined, this);
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo", "bar", "baz"]);
        expect(out.vars).toEqual(new Set(["foo", "bar", "baz", "rest"]));
      });

      it("should LOSE REACTIVITY with renamed props inside body without a derived", () => {
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
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component(props) {
            const foot = props.foo.value;
            const bart = props.bar.value;
            const bazt = props.baz.value;
            console.log(foot);
            if (bart) return jsxDEV("div", {children: bazt}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo", "bar", "baz"]);
        expect(out.vars).toEqual(
          new Set([
            "foo",
            "bar",
            "baz",
            "foot",
            "props",
            "bart",
            "bazt",
            "console",
          ]),
        );
      });

      it("should NOT lose reactivity with renamed state props inside body", () => {
        const code = `
          export default function Component({}, { state }) {
            const stateFoo = state('foo');
            const stateBar = state('bar');
            const stateBaz = state('baz');
            const renamedFoo = stateFoo;
            const renamedBar = stateBar;
            const renamedBaz = stateBaz;
            return <div>{renamedFoo.value}{renamedBar.value}{renamedBaz.value}</div>;
          }`;

        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode =
          normalizeQuotes(`export default function Component({}, {state}) {
            const stateFoo = state('foo');
            const stateBar = state('bar');
            const stateBaz = state('baz');
            const renamedFoo = stateFoo;
            const renamedBar = stateBar;
            const renamedBaz = stateBaz;
            return jsxDEV("div", {children: [renamedFoo.value, renamedBar.value, renamedBaz.value]}, undefined, true, undefined, this);
          }`);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual([]);
        expect(out.vars).toEqual(
          new Set([
            "stateFoo",
            "stateBar",
            "stateBaz",
            "renamedFoo",
            "renamedBar",
            "renamedBaz",
          ]),
        );
      });

      it("should lose reactivity if it is done deliberately in the state", () => {
        const code = `
        export default function Component({}, { state }) {
          const stateFoo = state('foo');
          const stateBar = state('bar');
          const stateBaz = state('baz');
          const renamedFoo = stateFoo.value;
          const renamedBar = stateBar.value;
          const renamedBaz = stateBaz.value;
          return <div>{renamedFoo}{renamedBar}{renamedBaz}</div>;
        }`;

        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode =
          normalizeQuotes(`export default function Component({}, {state}) {
          const stateFoo = state('foo');
          const stateBar = state('bar');
          const stateBaz = state('baz');
          const renamedFoo = stateFoo.value;
          const renamedBar = stateBar.value;
          const renamedBaz = stateBaz.value;
          return jsxDEV("div", {children: [renamedFoo, renamedBar, renamedBaz]}, undefined, true, undefined, this);
        }`);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual([]);
        expect(out.vars).toEqual(
          new Set([
            "stateFoo",
            "stateBar",
            "stateBaz",
            "renamedFoo",
            "renamedBar",
            "renamedBaz",
          ]),
        );
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
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component(props) {
            const {foo: foot, bar: bart, baz: bazt} = props;
            console.log(foot.value);
            if (bart.value) return jsxDEV("div", {children: bazt.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo", "bar", "baz"]);
        expect(out.vars).toEqual(
          new Set(["foo", "bar", "baz", "props", "console"]),
        );
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
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
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
        expect(out.props).toEqual(["foo", "bar", "baz"]);
        expect(out.vars).toEqual(
          new Set(["foo", "bar", "baz", "console", "props"]),
        );
      });

      it("should not add .value inside an attribute key, only in the value", () => {
        const code = `
          export default function Component({foo, bar}) {
            return <div foo={bar}>test</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component({foo, bar}) {
            return jsxDEV("div", {foo: bar.value,children: "test"}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo", "bar"]);
        expect(out.vars).toEqual(new Set(["foo", "bar"]));
      });

      it("should remove the default props from params and add them to the component body", () => {
        const code = `
          export default function Component({ foo, bar = "bar", baz = "baz" }) {
            return <div>{foo}{bar}{baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component({foo, bar, baz}, {effect}) {
            effect(() => baz.value ??= 'baz');
            effect(() => bar.value ??= 'bar');
            return jsxDEV("div", {children: [foo.value, bar.value, baz.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo", "bar", "baz"]);
        expect(out.vars).toEqual(new Set(["foo", "bar", "baz"]));
      });

      it("should not transform to reactive if the prop name is children", () => {
        const code = `
          export default function Component({ children }) {
            return <div>{children}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component({children}) {
            return jsxDEV("div", {children}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual([]);
        expect(out.vars).toEqual(new Set());
      });

      it("should transform to reactive if some another prop is renamed to children", () => {
        const code = `
          export default function Component({ foo, bar: children }) {
            return <div>{foo}{children}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component({foo, bar: children}) {
            return jsxDEV("div", {children: [foo.value, children.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo", "bar"]);
        expect(out.vars).toEqual(new Set(["foo", "bar"]));
      });

      it("should transform to reactive if is used inside a function call with a object expression", () => {
        const code = `
          const bar = (props) => <div>{props.baz}</div>;
          export default function Component({ foo }) {
            return <div>{bar({ foo })}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          const bar = props => jsxDEV("div", {children: props.baz}, undefined, false, undefined, this);
          export default function Component({foo}) {
            return jsxDEV("div", {children: bar({foo: foo.value})}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo"]);
        expect(out.vars).toEqual(new Set(["foo"]));
      });

      it("should not transform to reactive the props that are events", () => {
        const code = `
          export default function Component(props) {
            const { onClick, ...rest } = props;
            return <div onClick={onClick}><div onClick={rest.onClickSpan}>Click</div></div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component(props) {
            const {onClick, ...rest} = props;
            return jsxDEV("div", {onClick,children: jsxDEV("div", {onClick: rest.onClickSpan,children: "Click"}, undefined, false, undefined, this)}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["onClick", "onClickSpan"]);
        expect(out.vars).toEqual(
          new Set(["onClick", "onClickSpan", "props", "rest"]),
        );
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
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
            export default function RuntimeLog({error, warning}) {
              return jsxDEV("dialog", {open: error.value || warning.value,children: [error.value && \`Error: \${error.value.message}\`, error.value && jsxDEV("pre", {children: error.value.stack}, undefined, false, undefined, this), warning.value && \`Warning: \${warning.value}\`]}, undefined, true, undefined, this);
            }
          `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["error", "warning"]);
        expect(out.vars).toEqual(new Set(["error", "warning"]));
      });

      it("should transform the prop if it return the prop without JSX", () => {
        const code = `
          function Component({ foo = 'foo' }) {
            return foo;
          }

          export default Component;
        `;

        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          let Component = function ({foo}, {effect}) {
            effect(() => foo.value ??= 'foo');
            return foo.value;
          };
          
          export default Component;
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo"]);
        expect(out.vars).toEqual(new Set(["foo", "Component"]));
      });

      it("should transform the prop if it return the prop without JSX in an async component", () => {
        const code = `
          async function Component({ foo }) {
            return foo;
          }

          export default Component;
        `;

        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          async function Component({foo}) {
            return foo.value;
          }

          export default Component;
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo"]);
        expect(out.vars).toEqual(new Set(["foo"]));
      });

      it("should transform the prop with default prop if it return the prop without JSX in an async component", () => {
        const code = `
          async function Component({ someTestProp = 'foo' }) {
            return someTestProp;
          }

          export default Component;
        `;

        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          async function Component({someTestProp}, {effect}) {
            effect(() => someTestProp.value ??= 'foo');
            return someTestProp.value;
          }

          export default Component;
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["someTestProp"]);
        expect(out.vars).toEqual(new Set(["someTestProp"]));
      });

      it("should transform a default prop declaration inside the body of the component", () => {
        const code = `
          export default function Component({ foo }, { derived}) {
            const bar = derived(() => foo ?? "bar");
            return <div>{bar.value}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component({foo}, {derived}) {
            const bar = derived(() => foo.value ?? "bar");
            return jsxDEV("div", {children: bar.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo"]);
        // adding default props inside a derived is not considered as default props
        expect(out.vars).toEqual(new Set(["foo", "bar"]));
      });

      it("should transform conditional props in a variable", () => {
        const code = `export default function MyComponent({foo, bar}) {
          const baz = foo && bar;
          return <div>{baz ? 'TRUE' : 'FALSE'}</div>
        }`;

        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode =
          normalizeQuotes(`export default function MyComponent({foo, bar}) {
          const baz = foo.value && bar.value;
          return jsxDEV("div", {children: baz ? 'TRUE' : 'FALSE'}, undefined, false, undefined, this);
        }`);

        expect(outputCode).toBe(expectedCode);
        expect(out.props).toEqual(["foo", "bar"]);
        expect(out.vars).toEqual(new Set(["foo", "bar", "baz"]));
      });
    });
  });
});
