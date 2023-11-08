import { describe, expect, it } from "bun:test";
import transformToReactiveArrays from ".";
import AST from "../../ast";
import { ESTree } from "meriyah";

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
    });
  });
});
