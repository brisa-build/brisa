import { describe, expect, it, spyOn } from "bun:test";
import transformToReactiveArrays from ".";
import AST from "../../ast";
import { ESTree } from "meriyah";
import getConstants from "../../../constants";

const { parseCodeToAST, generateCodeFromAST } = AST();
const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');
const toOutputCode = (ast: ESTree.Program) =>
  toInline(generateCodeFromAST(ast));

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("transform-to-reactive-arrays", () => {
      it("should transform JSX to an array if is not a web-component", () => {
        const input = parseCodeToAST(`const element = <div>foo</div>`);
        const output = toOutputCode(transformToReactiveArrays(input));
        const expected = toInline(`const element = ['div', {}, 'foo'];`);
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
        const expected = toInline(`
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
        const expected = toInline(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            return ['div', {}, [['button', {onClick: () => count(count.value + 1)}, 'Click'], ['span', {}, () => count.value]]];
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
        const expected = toInline(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            return ['div', {}, () => count.value > 0 && ['span', {}, () => count.value]];
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
        const expected = toInline(`
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
        const expected = toInline(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            return ['div', {}, () => count.value > 0 ? ['span', {}, () => count.value] : ['span', {}, '0']];
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
        const expected = toInline(`
          export default function MyComponent({}, {state}) {
            const count = state(0);
            return ['div', {}, ['span', {title: () => count.value}, '']];
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
        const expected = toInline(`
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
        const expected = toInline(`
          export default function MyComponent() {
            return [null, {}, [[null, {}, "foo"], [null, {}, "bar"]]];
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
        const expected = toInline(`
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
          `Docs: https://brisa.dev/docs/component-details/web-components`,
        ]);
      });
    });
  });
});
