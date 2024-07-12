import { describe, expect, it } from "bun:test";
import transformToReactiveProps from ".";
import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";

const { parseCodeToAST, generateCodeFromAST } = AST();
const VARS = [
  'const foo = "bar";',
  "const {foo} = {};",
  "const {bar: foo} = {};",
  'const {bar: foo = "bar"} = {};',
  "const {foo, ...rest} = {};",
  "const {bart: bar, foot: foo} = {};",
  "const {bar: {baz: {foo}}} = {};",
  'const {bar: {baz: {foo = "bar"}}} = {};',
  "const {bar: {foo = foo => foo}} = {};",
];
const PARAMS = [
  "foo",
  "...foo",
  "{foo}",
  "{...foo}",
  "{bar: foo}",
  '{bar: foo = "bar"}',
  "{foo, ...rest}",
  "{bart: bar, foot: foo}",
  "{bar: {baz: {foo}}}",
  '{bar: {baz: {foo = "bar"}}}',
  "{bar: {foo = baz => true}}",
];

describe("utils", () => {
  describe("client-build-plugin", () => {
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar", "baz"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar", "baz"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar", "baz"]));
        expect(out.vars).toEqual(new Set(["foo", "bar", "baz", "console"]));
      });

      it("should transform all props from destructured props with rest", () => {
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar", "baz"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar", "baz"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar", "baz"]));
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
        expect(out.observedAttributes).toBeEmpty();
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
        expect(out.observedAttributes).toBeEmpty();
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar", "baz"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar", "baz"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar"]));
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
          export default function Component(__b_props__, {derived}) {
            const {foo} = __b_props__;
            const bar = derived(() => __b_props__.bar.value ?? 'bar');
            const baz = derived(() => __b_props__.baz.value ?? 'baz');
            return jsxDEV("div", {children: [foo.value, bar.value, baz.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar", "baz"]));
        expect(out.vars).toEqual(new Set(["foo", "bar", "baz"]));
      });

      it("should remove destructuring props from params and add them to the component body", () => {
        const code = `
          export default function Component({foo: {bar: {baz}, bar} }) {
            return <div>{bar}{baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component(__b_props__, {derived}) {
            const baz = derived(() => __b_props__.foo.value.bar.baz);
            const bar = derived(() => __b_props__.foo.value.bar);
            return jsxDEV("div", {children: [bar.value, baz.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
        expect(out.vars).toEqual(new Set(["foo", "bar", "baz"]));
      });

      it("should remove destructuring with default values and add the optimizations", () => {
        const code = `export default function Foo({ foo: { bar: { baz = "bar" } = {}, quux } = {} } = {}) {
          return <div>{quux}{baz}</div>
        }`;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode =
          normalizeQuotes(`export default function Foo(__b_props__, {derived}) {
          const baz = derived(() => ((__b_props__.foo.value ?? ({})).bar ?? ({})).baz ?? "bar");
          const quux = derived(() => (__b_props__.foo.value ?? ({})).quux);
          return jsxDEV("div", {children: [quux.value, baz.value]}, undefined, true, undefined, this);
        }`);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
        expect(out.vars).toEqual(new Set(["foo", "quux", "baz"]));
      });

      it("should remove destructuring props with default value from params and add them to the component body", () => {
        const code = `
          export default function Component({foo: {bar: {baz = "bar"}, quux} }) {
            return <div>{quux}{baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component(__b_props__, {derived}) {
            const baz = derived(() => __b_props__.foo.value.bar.baz ?? "bar");
            const quux = derived(() => __b_props__.foo.value.quux);
            return jsxDEV("div", {children: [quux.value, baz.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
        expect(out.vars).toEqual(new Set(["foo", "quux", "baz"]));
      });

      it("should remove destructuring props with rename from params and add them to the component body", () => {
        const code = `
          export default function Component({foo: {bar: {baz: brisa}, bar} }) {
            return <div>{bar}{brisa}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component(__b_props__, {derived}) {
            const brisa = derived(() => __b_props__.foo.value.bar.baz);
            const bar = derived(() => __b_props__.foo.value.bar);
            return jsxDEV("div", {children: [bar.value, brisa.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
        expect(out.vars).toEqual(new Set(["foo", "bar", "brisa"]));
      });

      it("should remove destructuring array props from params and add them to the component body", () => {
        const code = `
          export default function Component({foo: [{bar: [{baz}], bar}] }) {
            return <div>{bar}{baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component(__b_props__, {derived}) {
            const baz = derived(() => __b_props__.foo.value[0].bar[0].baz);
            const bar = derived(() => __b_props__.foo.value[0].bar);
            return jsxDEV("div", {children: [bar.value, baz.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
        expect(out.vars).toEqual(new Set(["foo", "bar", "baz"]));
      });

      it("should remove destructuring array props with default value from params and add them to the component body", () => {
        const code = `
          export default function Component({foo: [{bar: [{baz = "bar"}], bar}] }) {
            return <div>{bar}{baz}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component(__b_props__, {derived}) {
            const baz = derived(() => __b_props__.foo.value[0].bar[0].baz ?? "bar");
            const bar = derived(() => __b_props__.foo.value[0].bar);
            return jsxDEV("div", {children: [bar.value, baz.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
        expect(out.vars).toEqual(new Set(["foo", "baz", "bar"]));
      });

      it("should remove destructuring array props with rename from params and add them to the component body", () => {
        const code = `
          export default function Component({foo: [{bar: [{baz: brisa}], bar}] }) {
            return <div>{bar}{brisa}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);

        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
          export default function Component(__b_props__, {derived}) {
            const brisa = derived(() => __b_props__.foo.value[0].bar[0].baz);
            const bar = derived(() => __b_props__.foo.value[0].bar);
            return jsxDEV("div", {children: [bar.value, brisa.value]}, undefined, true, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
        expect(out.vars).toEqual(new Set(["foo", "brisa", "bar"]));
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
        expect(out.observedAttributes).toBeEmpty();
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
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
        expect(out.observedAttributes).toEqual(
          new Set(["onClick", "onClickSpan"]),
        );
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
        expect(out.observedAttributes).toEqual(new Set(["error", "warning"]));
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
          let Component = function (__b_props__, {derived}) {
            const foo = derived(() => __b_props__.foo.value ?? "foo");
            return foo.value;
          };
          
          export default Component;
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
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
          async function Component(__b_props__, {derived}) {
            const someTestProp = derived(() => __b_props__.someTestProp.value ?? 'foo');
            return someTestProp.value;
          }

          export default Component;
        `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["someTestProp"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
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
        expect(out.observedAttributes).toEqual(new Set(["foo", "bar"]));
        expect(out.vars).toEqual(new Set(["foo", "bar", "baz"]));
      });

      it("should not transform a prop converted to state", () => {
        const code = `
        export default function Component(props, { state }) {
          const inputs = state(props.value ?? ['foo']);
          
          return (
            <div>
              {inputs.value.map(input => (<div key={input}>{input}</div>))}
            </div>
          )
        }
      `;

        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
        export default function Component(props, {state}) {
          const inputs = state(props.value.value ?? ['foo']);
          return jsxDEV('div', {children: inputs.value.map(input => jsxDEV("div", {children: input}, input, false, undefined, this))}, undefined, false, undefined, this);
        }
      `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["value"]));
        expect(out.vars).toEqual(new Set(["value", "inputs", "props"]));
      });

      it("should not transform a derived prop identifier that is not an optimization", () => {
        const code = `
        export default function Component(props, { derived }) {
          const foo = derived(() => props.foo ?? ['foo']);
          console.log('Signal:', foo, [foo], ...foo); // should not transform this
          return (
            <div>
              {foo.value}
            </div>
          )
        }
      `;

        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
        export default function Component(props, {derived}) {
          const foo = derived(() => props.foo.value ?? ['foo']);
          console.log('Signal:', foo, [foo], ...foo);
          return jsxDEV('div', {children: foo.value}, undefined, false, undefined, this);
        }
      `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["foo"]));
        expect(out.vars).toEqual(new Set(["foo", "props", "console"]));
      });

      it("should not transform a derived prop that is not an optimization", () => {
        const code = `
        export default function Component(props, { derived }) {
          const inputs = derived(() => props.inputs ?? ['foo']);
          
          return (
            <div>
              {inputs.value.map(input => (<div key={input}>{input}</div>))}
            </div>
          )
        }
      `;

        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

        const expectedCode = normalizeQuotes(`
        export default function Component(props, {derived}) {
          const inputs = derived(() => props.inputs.value ?? ['foo']);
          return jsxDEV('div', {children: inputs.value.map(input => jsxDEV("div", {children: input}, input, false, undefined, this))}, undefined, false, undefined, this);
        }
      `);

        expect(outputCode).toBe(expectedCode);
        expect(out.observedAttributes).toEqual(new Set(["inputs"]));
        expect(out.vars).toEqual(new Set(["inputs", "props"]));
      });

      it("should add optimizations in arrow function without block statement", () => {
        const code = `export default ({ name = "Aral" }) => <div>{name}</div>;`;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));
        const expectedCode = normalizeQuotes(`
          export default (__b_props__, {derived}) => {
            const name = derived(() => __b_props__.name.value ?? "Aral");
            
            return jsxDEV("div", {children: name.value}, undefined, false, undefined, this);
          };
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it("should not transform external variables with same name as props using props identifier", () => {
        const code = `
          const foo = 'foo';
          export default function Component(props) {
            console.log(foo);
            return <div>{props.foo}</div>;
          }
        `;
        const ast = parseCodeToAST(code);
        const out = transformToReactiveProps(ast);
        const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));
        const expectedCode = normalizeQuotes(`
          const foo = 'foo';
          export default function Component(props) {
            console.log(foo);
            return jsxDEV("div", {children: props.foo.value}, undefined, false, undefined, this);
          }
        `);

        expect(outputCode).toBe(expectedCode);
      });

      it.each(VARS)(
        "should not conflict between props.foo and %s variable",
        (varType) => {
          const code = `
          export default function Component(props, { state }) {
            const example = state(props.foo);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component(props, {state}) {
            const example = state(props.foo.value);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(PARAMS)(
        "should not conflict between props.foo and %s param",
        (param) => {
          const code = `
          export default function Component(props, { state }) {
            const example = state(props.foo);

            function onClick(${param}) {
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component(props, {state}) {
            const example = state(props.foo.value);

            function onClick(${param}) {
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(VARS)(
        "should not conflict between destructuring props.foo and %s variable",
        (varType) => {
          const code = `
          export default function Component({...props}, { state }) {
            const example = state(props.foo);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component({...props}, {state}) {
            const example = state(props.foo.value);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(PARAMS)(
        "should not conflict between destructuring props.foo and %s param",
        (param) => {
          const code = `
          export default function Component({...props}, { state }) {
            const example = state(props.foo);

            function onClick(${param}) {
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component({...props}, {state}) {
            const example = state(props.foo.value);

            function onClick(${param}) {
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(VARS)(
        "should not conflict between {foo} props and %s variable",
        (varType) => {
          const code = `
          export default function Component({foo}, { state }) {
            const example = state(foo);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component({foo}, {state}) {
            const example = state(foo.value);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(PARAMS)(
        "should not conflict between {foo} props and %s param",
        (param) => {
          const code = `
          export default function Component({foo}, { state }) {
            const example = state(foo);

            function onClick(${param}) {
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component({foo}, {state}) {
            const example = state(foo.value);

            function onClick(${param}) {
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(VARS)(
        'should not conflict between {foo="bar"} props and %s variable',
        (varType) => {
          const code = `
          export default function Component({foo="bar"}, { state }) {
            const example = state(foo);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component(__b_props__, {state, derived}) {
            const foo = derived(() => __b_props__.foo.value ?? "bar");
            const example = state(foo.value);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(PARAMS)(
        'should not conflict between {foo="bar"} props and %s param',
        (param) => {
          const code = `
          export default function Component({foo="bar"}, { state }) {
            const example = state(foo);

            function onClick(${param}) {
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component(__b_props__, {state, derived}) {
            const foo = derived(() => __b_props__.foo.value ?? "bar");
            const example = state(foo.value);

            function onClick(${param}) {
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(VARS)(
        "should not conflict between {foot: foo} props and %s variable",
        (varType) => {
          const code = `
          export default function Component({foot: foo}, { state }) {
            const example = state(foo);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component({foot: foo}, {state}) {
            const example = state(foo.value);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(PARAMS)(
        "should not conflict between {foot: foo} props and %s param",
        (param) => {
          const code = `
          export default function Component({foot: foo}, { state }) {
            const example = state(foo);

            function onClick(${param}) {
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component({foot: foo}, {state}) {
            const example = state(foo.value);

            function onClick(${param}) {
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(VARS)(
        "should not conflict between {foot: {foo}} props and %s variable",
        (varType) => {
          const code = `
          export default function Component({foot: {foo}}, { state }) {
            const example = state(foo);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component(__b_props__, {state, derived}) {
            const foo = derived(() => __b_props__.foot.value.foo);
            const example = state(foo.value);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(PARAMS)(
        "should not conflict between {foot: {foo}} props and %s param",
        (param) => {
          const code = `
          export default function Component({foot: {foo}}, { state }) {
            const example = state(foo);

            function onClick(${param}) {
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component(__b_props__, {state, derived}) {
            const foo = derived(() => __b_props__.foot.value.foo);
            const example = state(foo.value);

            function onClick(${param}) {
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(VARS)(
        "should not conflict between renamed props in a var and %s variable",
        (varType) => {
          const code = `
          export default function Component(props, { state }) {
            const foo = props.bar;
            const example = state(foo);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component(props, {state}) {
            const foo = props.bar.value;
            const example = state(foo);

            function onClick() {
              ${varType}
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );

      it.each(PARAMS)(
        "should not conflict between {renamed props in a var and %s param",
        (param) => {
          const code = `
          export default function Component(props, { state }) {
            const foo = props.bar;
            const example = state(foo);

            function onClick(${param}) {
              console.log(foo);
            }

            return <div onClick={() => {}}>{example.value}</div>;
          }
      `;

          const ast = parseCodeToAST(code);
          const out = transformToReactiveProps(ast);
          const outputCode = normalizeQuotes(generateCodeFromAST(out.ast));

          const expectedCode = normalizeQuotes(`
          export default function Component(props, {state}) {
            const foo = props.bar.value;
            const example = state(foo);

            function onClick(${param}) {
              console.log(foo);
            }

            return jsxDEV("div", {onClick: () => {},children: example.value}, undefined, false, undefined, this);
          }
      `);
          expect(outputCode).toBe(expectedCode);
        },
      );
    });
  });
});
