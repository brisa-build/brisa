import { describe, expect, it, spyOn } from "bun:test";
import { ESTree } from "meriyah";
import transformToReactiveArrays from ".";
import getConstants from "../../../constants";
import { normalizeQuotes } from "../../../helpers";
import AST from "../../ast";

const { parseCodeToAST, generateCodeFromAST } = AST();
const toOutputCode = (ast: ESTree.Program) =>
  normalizeQuotes(generateCodeFromAST(ast));

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("transform-to-reactive-arrays", () => {
      it("should transform JSX to an array if is not a web-component", () => {
        const input = parseCodeToAST(`const element = <div>foo</div>`);
        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`const element = ['div', {}, 'foo'];`);
        expect(output).toBe(expected);
      });

      it("should transform JSX to an array if is a web-component arrow fn", () => {
        const input = parseCodeToAST(
          `export default ({ name = 'foo' }) => <div>{name}</div>`,
        );
        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(
          `export default ({name = 'foo'}) => ['div', {}, name];`,
        );
        expect(output).toBe(expected);
      });

      it("should transform JSX to an array if is a web-component", () => {
        const input = parseCodeToAST(`
          export default function MyComponent() {
            return (
              <div>
                Hello world
              </div>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent() {
            return ['div', {}, 'Hello world'];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should transform JSX to an reactive array if have some signal (state)", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { state }) {
            const count = state(0);

            return (
              <div>
                <button onClick={() => count(count.value + 1)}>Click</button>
                <span>{count.value}</span>
              </div>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            return ['div', {}, [['button', {onClick: () => count(count.value + 1)}, 'Click'], ['span', {}, () => count.value]]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should transform to reactive attribute when it has a signal (state) inside", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { state }) {
            const bar = state(0);

            return (
              <some-component value={{ foo: bar.value }}>
                Hello world
              </some-component>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {state}) {
            const bar = state(0);
            return ['some-component', {value: () => ({foo: bar.value})}, 'Hello world'];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should transform to reactive attribute when it has a signal (store) inside", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { store }) {
            return (
              <some-component value={{ foo: store.get('bar') }}>
                Hello world
              </some-component>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {store}) {
            return ['some-component', {value: () => ({foo: store.get('bar')})}, 'Hello world'];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should transform JSX to an reactive array if have some signal (state) inside suspense", () => {
        const input = parseCodeToAST(`
          export default function MyComponent() {
            return 'Hello world'
          }

          MyComponent.suspense = ({}, { state }) => {
            const loading = state('Loading');

            return (
              <div>
                {loading.value}
              </div>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent() {return "Hello world";}
          
          MyComponent.suspense = ({}, {state}) => {
            const loading = state("Loading");
            return ["div", {}, () => loading.value];
          };
        `);
        expect(output).toBe(expected);
      });

      it("should transform JSX to an reactive array if have some signal (store) inside suspense", () => {
        const input = parseCodeToAST(`
          export default function MyComponent() {
            return 'Hello world'
          }

          MyComponent.suspense = ({}, { store }) => {
            return (
              <div>
                {store.get('loading')}
              </div>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent() {return "Hello world";}
          
          MyComponent.suspense = ({}, {store}) => {
            return ["div", {}, () => store.get('loading')];
          };
        `);
        expect(output).toBe(expected);
      });

      it("should transform JSX to an reactive array if have some signal (store)", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { store }) {
            return (
              <div>
                <button onClick={() => store.set('count', store.get('store') + 1)}>Click</button>
                <span>{store.get('count')}</span>
              </div>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {store}) {
            return ['div', {}, [['button', {onClick: () => store.set('count', store.get('store') + 1)}, 'Click'], ['span', {}, () => store.get('count')]]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should change signals to function if the signal state is used in a conditional", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { state }) {
            const count = state(0);

            return (
              <div>
                {count.value > 0 && <span>{count.value}</span>}
              </div>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            return ['div', {}, () => count.value > 0 && ['span', {}, () => count.value]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should change signals to function if the signal store is used in a conditional", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { store }) {
            return (
              <div>
                {store.get('count') > 0 && <span>{store.get('count')}</span>}
              </div>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {store}) {
            return ['div', {}, () => store.get('count') > 0 && ['span', {}, () => store.get('count')]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should not change signals to function if the signal state is used in an event", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { state }) {
            const count = state(0);

            function handleClick() {
              console.log(count.value);
            }

            return (
              <div>
                <button onClick={handleClick}>Click</button>
              </div>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            function handleClick() {
              console.log(count.value);
            }
            return ['div', {}, ['button', {onClick: handleClick}, 'Click']];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should change signals to function if the signal state is used in a ternary", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { state }) {
            const count = state(0);

            return (
              <div>
                {count.value > 0 ? <span>{count.value}</span> : <span>0</span>}
              </div>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            return ['div', {}, () => count.value > 0 ? ['span', {}, () => count.value] : ['span', {}, '0']];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should change signals to function if the signal store is used in a ternary", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { store }) {
            return (
              <div>
                {store.get('count') > 0 ? <span>{store.get('count')}</span> : <span>0</span>}
              </div>
            )
          }
        `);

        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {store}) {
            return ['div', {}, () => store.get('count') > 0 ? ['span', {}, () => store.get('count')] : ['span', {}, '0']];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should change signals to function if the signal state is used in an atributte", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { state }) {
            const count = state(0);

            return (
              <div>
                <span title={count.value}></span>
              </div>
            )
          }
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            return ['div', {}, ['span', {title: () => count.value}, '']];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should change signals to function if the signal store is used in an atributte", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { store }) {
            return (
              <div>
                <span title={store.get('title')}></span>
              </div>
            )
          }
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {store}) {
            return ['div', {}, ['span', {title: () => store.get('title')}, '']];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should change signals to function if the signal state is used in a child also", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { state }) {
            const count = state(0);

            return (
              <div>
                <span title={count.value}></span>
                {count.value}
              </div>
            )
          }
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            return ['div', {}, [['span', {title: () => count.value}, ''], [null, {}, () => count.value]]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should change signals to function if the signal store is used in a child also", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { store }) {
            return (
              <div>
                <span title={store.get('count')}></span>
                {store.get('count')}
              </div>
            )
          }
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {store}) {
            return ['div', {}, [['span', {title: () => store.get('count')}, ''], [null, {}, () => store.get('count')]]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should change signals to function if the signal state is used in a child element also", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { state }) {
            const count = state(0);

            return (
              <div>
                <span title={count.value}></span>
                <span>{count.value}</span>
              </div>
            )
          }
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            return ['div', {}, [['span', {title: () => count.value}, ''], ['span', {}, () => count.value]]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should change signals to function if the signal store is used in a child element also", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({}, { store }) {
            return (
              <div>
                <span title={store.get('count')}></span>
                <span>{store.get('count')}</span>
              </div>
            )
          }
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent({}, {store}) {
            return ['div', {}, [['span', {title: () => store.get('count')}, ''], ['span', {}, () => store.get('count')]]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should work with fragments", () => {
        const input = parseCodeToAST(`
          export default function MyComponent() {
            return (
              <>
                <div>foo</div>
                <div>bar</div>
              </>
            )
          }
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent() {
            return [null, {}, [['div', {}, 'foo'], ['div', {}, 'bar']]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should work with multiple fragments", () => {
        const input = parseCodeToAST(`
        export default function MyComponent() {
          return (
            <>
              <>foo</>
              <>bar</>
            </>
          )
        }
      `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent() {
            return [null, {}, [[null, {}, "foo"], [null, {}, "bar"]]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should work with open attribute of a dialog from a prop", () => {
        const input = parseCodeToAST(`
          type RuntimeLogProps = {
            error: { stack: string, message: string };
            warning: string;
          }
          
          export default function RuntimeLog({ error, warning }: RuntimeLogProps) {
            return (
              <dialog open={error}>
                {error && \`Error: \${error.message}\`}
                {error && <pre>{error.stack}</pre>}
                {warning && \`Warning: \${warning}\`}
              </dialog>
            )
          }      
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);

        const expected = normalizeQuotes(`
          export default function RuntimeLog({error, warning}) {
            return ['dialog', {open: error ? _on : _off}, [[null, {}, error && \`Error: \${error.message}\`], [null, {}, error && ['pre', {}, error.stack]], [null, {}, warning && \`Warning: \${warning}\`]]];
          }
        `);

        expect(output).toBe(expected);
      });

      it("should work with open attribute of a dialog from a prop with an expression", () => {
        const input = parseCodeToAST(`
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
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);

        const expected = normalizeQuotes(`
          export default function RuntimeLog({error, warning}) {
            return ['dialog', {open: error || warning ? _on : _off}, [[null, {}, error && \`Error: \${error.message}\`], [null, {}, error && ['pre', {}, error.stack]], [null, {}, warning && \`Warning: \${warning}\`]]];
          }
        `);

        expect(output).toBe(expected);
      });

      it("should ignore server-components as fragments and log with an error", () => {
        const { LOG_PREFIX } = getConstants();
        const input = parseCodeToAST(`
            function Test(props) {
              return (
                <div>{props.children}</div>
              )
            }

            export default function MyComponent() {
              return (
                <Test someProp={true}>
                  <div>foo</div>
                  <span>bar</span>
                </Test>
              )
            }
          `);
        const logMock = spyOn(console, "log");
        logMock.mockImplementation(() => {});
        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
            let Test = function (props) {
              return ['div', {}, props.children];
            };
            export default function MyComponent() {
              return [null, {}, [['div', {}, 'foo'], ['span', {}, 'bar']]];
            }
          `);
        const logs = logMock.mock.calls.slice(0);

        logMock.mockRestore();
        expect(output).toBe(expected);
        expect(logs[0]).toEqual([LOG_PREFIX.ERROR, `Ops! Error:`]);
        expect(logs[1]).toEqual([
          LOG_PREFIX.ERROR,
          `--------------------------`,
        ]);
        expect(logs[2]).toEqual([
          LOG_PREFIX.ERROR,
          `You can't use "Test" variable as a tag name.`,
        ]);
        expect(logs[3]).toEqual([
          LOG_PREFIX.ERROR,
          `Please use a string instead. You cannot use server-components inside web-components directly.`,
        ]);
        expect(logs[4]).toEqual([
          LOG_PREFIX.ERROR,
          `You must use the "children" or slots in conjunction with the events to communicate with the server-components.`,
        ]);
        expect(logs[5]).toEqual([
          LOG_PREFIX.ERROR,
          `--------------------------`,
        ]);
        expect(logs[6]).toEqual([
          LOG_PREFIX.ERROR,
          `Docs: https://brisa.build/docs/component-details/web-components`,
        ]);
      });

      it("should transform multi JSX interpolations like fragments", () => {
        const input = parseCodeToAST(`
          export default function MyComponent() {
            const example = 'example';
            return  <div>{'this'} {'is'} {1} {example}</div>
          }
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent() {
            const example = 'example';
            return ['div', {}, [[null, {}, "this"], [null, {}, " "], [null, {}, "is"], [null, {}, " "], [null, {}, 1], [null, {}, " "], [null, {}, example]]];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should allow returning an array of strings without applying any transformation", () => {
        const input = parseCodeToAST(`
          export default function MyComponent() {
            return ['Hello', ' ', 'World'];
          }
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent() {
            return ['Hello', ' ', 'World'];
          }
        `);
        expect(output).toBe(expected);
      });

      it("should return a fragment with the ternary", () => {
        const input = parseCodeToAST(`
          export default function MyComponent({ error }) {
            return (
              <>
                Test
                {error.value ? <>{\`Error: \${error.value.message}\`} <pre>{error.value.stack}</pre></> : ''}
              </>
            )
          }`);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
        export default function MyComponent({error}) {
          return [null, {}, [[null, {}, "Test"], [null, {}, () => error.value ? [null, {}, [[null, {}, () => \`Error: \${error.value.message}\`], [null, {}, " "], ["pre", {}, () => error.value.stack]]] : ""]]];
        }
        `);
        expect(output).toBe(expected);
      });

      it('should keep the "key" attribute', () => {
        const input = parseCodeToAST(`
          export default function MyComponent() {
            return (
              <div key="foo">foo</div>
            )
          }
        `);

        const outputAst = transformToReactiveArrays(input);
        const output = toOutputCode(outputAst);
        const expected = normalizeQuotes(`
          export default function MyComponent() {
            return ['div', {key: "foo"}, 'foo'];
          }
        `);
        expect(output).toBe(expected);
      });
    });
  });
});
