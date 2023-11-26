import { describe, expect, it } from "bun:test";
import { ESTree } from "meriyah";
import optimizeEffects from ".";
import AST from "../../ast";
import getWebComponentAst from "../get-web-component-ast";

const { parseCodeToAST, generateCodeFromAST } = AST();
const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');
const toOutput = (code: string) => {
  const reactiveAst = parseCodeToAST(code);
  const [componentBranch, index] = getWebComponentAst(reactiveAst);
  const outputComponentAst = optimizeEffects(
    componentBranch as ESTree.FunctionDeclaration
  );

  (reactiveAst.body[index as number] as any).declaration = outputComponentAst;

  return toInline(generateCodeFromAST(reactiveAst));
};

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("optimize-effects", () => {
      it("should not do any transformation if not the effect in webContext", () => {
        const input = `export default ({ }, { h }: any) => ['div', {}, 'test'];`;
        const expected = toInline(
          `export default ({}, {h}) => ['div', {}, 'test'];`
        );
        const output = toOutput(input);

        expect(output).toEqual(expected);
      });
      it("should not do any transformation if the not effect in webContext identifier", () => {
        const input = `export default ({ }, props: any) => {
          const { h } = props;
          return ['div', {}, 'test'];
        }`;
        const expected = toInline(`export default ({}, props) => {
          const {h} = props;
          return ['div', {}, 'test'];
        };`);
        const output = toOutput(input);

        expect(output).toEqual(expected);
      });
      it("should add 'true' as second parameter to cleanups used inside effects", () => {
        const input = `
          export default function Component({ propName }, { effect, cleanup }) {
            effect(() => {
              if (propName.value) {
                cleanup(() => console.log("Hello world"));
              }
            });

            cleanup(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = toInline(`
          export default function Component({propName}, {effect, cleanup}) {
            effect(r => {
              if (propName.value) {
                cleanup(() => console.log("Hello world"), r.id);
              }
            });

            cleanup(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should add 'true' as second parameter to cleanups used inside effects using different variable names", () => {
        const input = `
          export default function Component({ propName }, { effect: e, cleanup: c }) {
            e(() => {
              if (propName.value) {
                c(() => console.log("Hello world"));
              }
            });

            c(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = toInline(`
          export default function Component({propName}, {effect: e, cleanup: c}) {
            e(r => {
              if (propName.value) {
                c(() => console.log("Hello world"), r.id);
              }
            });

            c(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should add 'true' as second parameter to cleanups used inside effects using an identifier", () => {
        const input = `
          export default function Component({ propName }, props) {
            const { effect: e, cleanup: c } = props;

            e(u => {
              if (propName.value) {
                c(() => console.log("Hello world"));
              }
            });

            c(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = toInline(`
          export default function Component({propName}, props) {
            const {effect: e, cleanup: c} = props;

            e(u => {
              if (propName.value) {
                c(() => console.log("Hello world"), u.id);
              }
            });

            c(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should add 'true' as second parameter to cleanups used inside effects using rest", () => {
        const input = `
          export default function Component({propName}, {effect, ...rest}) {
            effect(r => {
              if (propName.value) {
                rest.cleanup(() => console.log("Hello world"), r.id);
              }
            });

            rest.cleanup(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world'];
          }
        `;
        const output = toOutput(input);
        const expected = toInline(`
        export default function Component({propName}, {effect, ...rest}) {
          effect(r => {
            if (propName.value) {
              rest.cleanup(() => console.log("Hello world"), r.id);
            }
          });

          rest.cleanup(() => console.log("Hello world"));
        
          return ['span', {}, 'Hello world'];
        }
        `);

        expect(output).toEqual(expected);
      });

      it("should work if the function of the effect is not an arrow function", () => {
        const input = `
          export default function Component({ propName }, { effect, cleanup }) {
            effect(function () {
              if (propName.value) {
                cleanup(() => console.log("Hello world"));
              }
            });

            cleanup(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = toInline(`
          export default function Component({propName}, {effect, cleanup}) {
            effect(function (r) {
              if (propName.value) {
                cleanup(() => console.log("Hello world"), r.id);
              }
            });

            cleanup(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should work if the function of the cleanup is not an arrow function", () => {
        const input = `
          export default function Component({ propName }, { effect, cleanup }) {
            effect(() => {
              if (propName.value) {
                cleanup(function () { console.log("Hello world") });
              }
            });

            cleanup(function () { console.log("Hello world") });
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = toInline(`
          export default function Component({propName}, {effect, cleanup}) {
            effect(r => {
              if (propName.value) {
                cleanup(function () {console.log("Hello world");}, r.id);
              }
            });

            cleanup(function () {console.log("Hello world");});
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should work if the function of the cleanup is in a variable", () => {
        const input = `
          export default function Component({ propName }, { effect, cleanup }) {
            const clean = () => console.log("Hello world");

            effect(() => {
              if (propName.value) {
                cleanup(clean);
              }
            });

            cleanup(clean);
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = toInline(`
          export default function Component({propName}, {effect, cleanup}) {
            const clean = () => console.log("Hello world");

            effect(r => {
              if (propName.value) {
                cleanup(clean, r.id);
              }
            });

            cleanup(clean);
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should work if the function of the effect is in a variable", () => {
        const input = `
          export default function Component({ propName }, { effect, cleanup }) {
            const fn = () => {
              if (propName.value) {
                cleanup(() => console.log("Hello world"));
              }
            };

            effect(fn);

            cleanup(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = toInline(`
          export default function Component({propName}, {effect, cleanup}) {
            const fn = r => {
              if (propName.value) {
                cleanup(() => console.log("Hello world"), r.id);
              }
            };

            effect(fn);

            cleanup(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should work with very nested effects and cleanups", () => {
        const input = `
          export default function Component({ propName }, { effect, cleanup }) {
            effect(() => {
              if (propName.value) {
                effect(() => {
                  if (propName.value) {
                    cleanup(() => console.log("Hello world"));
                  }
                });
              }
            });

            cleanup(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = toInline(`
          export default function Component({propName}, {effect, cleanup}) {
            effect(r => {
              if (propName.value) {
                effect(r => {
                  if (propName.value) {
                    cleanup(() => console.log("Hello world"), r.id);
                  }
                });
              }
            });

            cleanup(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });
    });
  });
});
