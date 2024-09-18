import { describe, expect, it, spyOn } from 'bun:test';
import type { ESTree } from 'meriyah';
import optimizeEffects from '.';
import { normalizeHTML, toInline } from '@/helpers';
import AST from '@/utils/ast';
import getWebComponentAst from '../get-web-component-ast';
import { getConstants } from '@/constants';
import { boldLog } from '@/utils/log/log-color';

const { parseCodeToAST, generateCodeFromAST } = AST();
const toOutput = (code: string) => {
  const reactiveAst = parseCodeToAST(code);
  const [componentBranch, index] = getWebComponentAst(reactiveAst);
  const outputComponentAst = optimizeEffects(
    componentBranch as ESTree.FunctionDeclaration,
  );

  (reactiveAst.body[index as number] as any).declaration = outputComponentAst;

  return normalizeHTML(generateCodeFromAST(reactiveAst));
};

describe('utils', () => {
  describe('client-build-plugin', () => {
    describe('optimize-effects', () => {
      it('should not do any transformation if not the effect in webContext', () => {
        const input = `export default ({ }, { h }: any) => ['div', {}, 'test'];`;
        const expected = normalizeHTML(
          `export default ({}, {h}) => ['div', {}, 'test'];`,
        );
        const output = toOutput(input);

        expect(output).toEqual(expected);
      });
      it('should not do any transformation if the not effect in webContext identifier', () => {
        const input = `export default ({ }, props: any) => {
          const { h } = props;
          return ['div', {}, 'test'];
        }`;
        const expected = normalizeHTML(`export default ({}, props) => {
          const {h} = props;
          return ['div', {}, 'test'];
        };`);
        const output = toOutput(input);

        expect(output).toEqual(expected);
      });
      it("should add 'r.id' as second parameter to cleanups used inside effects", () => {
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
        const expected = normalizeHTML(`
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

      it("should add 'r.id' as second parameter to cleanups used inside effects using different variable names", () => {
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
        const expected = normalizeHTML(`
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

      it("should add 'r.id' as second parameter to cleanups used inside effects using an identifier", () => {
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
        const expected = normalizeHTML(`
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

      it("should add 'r.id' as second parameter to cleanups used inside effects using rest", () => {
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
        const expected = normalizeHTML(`
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

      it('should work if the function of the effect is not an arrow function', () => {
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
        const expected = normalizeHTML(`
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

      it('should work if the function of the cleanup is not an arrow function', () => {
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
        const expected = normalizeHTML(`
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

      it('should work if the function of the cleanup is in a variable', () => {
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
        const expected = normalizeHTML(`
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

      it('should work if the function of the effect is in a variable', () => {
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
        const expected = normalizeHTML(`
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

      it('should work with very nested effects and cleanups', () => {
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
        const expected = normalizeHTML(`
          export default function Component({propName}, {effect, cleanup}) {
            effect(r => {
              if (propName.value) {
                effect(r(r1 => {
                  if (propName.value) {
                    cleanup(() => console.log("Hello world"), r1.id);
                  }
                }));
              }
            });

            cleanup(() => console.log("Hello world"));
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should wrap nested effect to "r" to register as subeffect', () => {
        const input = `
          export default function Component({ propName }, { effect }) {
            effect(() => {
              if (propName.value) {
                effect(() => {
                  if (propName.value) {
                    console.log("Hello world");
                  }
                });
              }
            });
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default function Component({propName}, {effect}) {
            effect(r => {
              if (propName.value) {
                effect(r(r1 => {
                  if (propName.value) {
                    console.log("Hello world");
                  }
                }));
              }
            });
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should wrap hypernested effect to "r" to register as subeffect', () => {
        const input = `
          export default function Component({ propName }, { effect }) {
            effect(() => {
              if (propName.value) {
                effect(() => {
                  if (propName.value) {
                    effect(() => {
                      if (propName.value) {
                        console.log("Hello world");
                      }
                    });
                  }
                });
              }
            });
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default function Component({propName}, {effect}) {
            effect(r => {
              if (propName.value) {
                effect(r(r1 => {
                  if (propName.value) {
                    effect(r(r1(r2 => {
                      if (propName.value) {
                        console.log("Hello world");
                      }
                    })));
                  }
                }));
              }
            });
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should not wrap nested effect to "r" to register as subeffect if the effect is not nested', () => {
        const input = `
          export default function Component({ propName }, { effect }) {
            effect(() => console.log(propName.value));
            effect(() => console.log(propName.value));
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default function Component({propName}, {effect}) {
            effect(r => console.log(propName.value));
            effect(r1 => console.log(propName.value));
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should wrap two nested effects to "r" to register as subeffect', () => {
        const input = `
          export default function Component({ propName }, { effect }) {
            effect(() => {
              if (propName.value) {
                effect(() => {
                  if (propName.value) {
                    console.log("Hello world");
                  }
                });
                effect(() => {
                  if (propName.value) {
                    console.log("Hello world");
                  }
                });
              }
            });
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default function Component({propName}, {effect}) {
            effect(r => {
              if (propName.value) {
                effect(r(r1 => {
                  if (propName.value) {
                    console.log("Hello world");
                  }
                }));
                effect(r(r2 => {
                  if (propName.value) {
                    console.log("Hello world");
                  }
                }));
              }
            });
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should wrap nested effects without block statement to "r" to register as subeffect', () => {
        const input = `
          export default function Component({ propName }, { effect }) {
            effect(() => propName.value && effect(() => console.log("Hello world")));
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default function Component({propName}, {effect}) {
            effect(r => propName.value && effect(r(r1 => console.log("Hello world"))));
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should wrap nested effects with different variable names to "r" to register as subeffect', () => {
        const input = `
          export default function Component({ propName }, { effect: e }) {
            e(() => {
              if (propName.value) {
                e(() => {
                  if (propName.value) {
                    console.log("Hello world");
                  }
                });
              }
            });
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default function Component({propName}, {effect: e}) {
            e(r => {
              if (propName.value) {
                e(r(r1 => {
                  if (propName.value) {
                    console.log("Hello world");
                  }
                }));
              }
            });
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should wrap nested effects in outside function to "r" to register as subeffect', () => {
        const input = `
          export default function Component({ propName }, { effect }) {
            const log = () => {
              console.log("Hello world");
            }
            function fn() {
              if (propName.value) {
                effect(log);
              }
            }

            effect(fn);
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default function Component({propName}, {effect}) {
            const log = () => {
              console.log("Hello world");
            };
            function fn(r1) {
              if (propName.value) {
                effect(r1(log));
              }
            }

            effect(fn);

            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should wrap nested effects in inside function to "r" to register as subeffect', () => {
        const input = `
          export default function Component({ propName }, { effect }) {
            effect(function () {
              if (propName.value) {
                effect(() => {
                  console.log("Hello world");
                });
              }
            });
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default function Component({propName}, {effect}) {
            effect(function (r) {
              if (propName.value) {
                effect(r(r1 => {
                  console.log("Hello world");
                }));
              }
            });

            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should not wrap nested effects with "r" if are already wrapped', () => {
        const input = `
          export default function Component({ propName }, { effect }) {
            effect(r => {
              if (propName.value) {
                effect(r(r1 => {
                  console.log("Hello world");
                }));
              }
            });
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
        export default function Component({propName}, {effect}) {
          effect(r => {
            if (propName.value) {
              effect(r(r1 => {
                console.log("Hello world");
              }));
            }
          });
        
          return ['span', {}, 'Hello world'];
        }
        `);

        expect(output).toEqual(expected);
      });

      it('should await the effect if it returns a promise', () => {
        const input = `
          export default function Component({ propName }, { effect }) {
            effect(async () => {
              if (propName.value) {
                console.log("Hello world");
              }
            });
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default async function Component({propName}, {effect}) {
            await effect(async r => {
              if (propName.value) {
                console.log("Hello world");
              }
            });
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should await the effect if it returns a promise from an arrow function component', () => {
        const input = `
          export default ({ propName }, { effect }) => {
            effect(async () => {
              if (propName.value) {
                console.log("Hello world");
              }
            });
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default async ({propName}, {effect}) => {
            await effect(async r => {
              if (propName.value) {
                console.log("Hello world");
              }
            });
          
            return ['span', {}, 'Hello world'];
          };
        `);

        expect(output).toEqual(expected);
      });

      it('should await all effect and subeffects only when one of them returns a promise', () => {
        const input = `
          export default function Component({ propName }, { effect }) {
            effect(() => {
              if (propName.value) {
                effect(async () => {
                  console.log("Hello world");
                });
                effect(() => {
                  console.log("Hello world");
                });
              }
            });
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeHTML(`
          export default async function Component({propName}, {effect}) {
            await effect(async r => {
              if (propName.value) {
                await effect(r(async r1 => {
                  console.log("Hello world");
                }));
                await effect(r(async r2 => {
                  console.log("Hello world");
                }));
              }
            });
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should warning a log when an async effect is not awaited', () => {
        const { LOG_PREFIX } = getConstants();
        const input = `
          export default function Component({ propName }, { effect }) {
            effect(async () => {
              if (propName.value) {
                console.log("Hello world");
              }
            });
          
            return ['span', {}, 'Hello world']
          }
        `;

        const log = spyOn(console, 'log');
        toOutput(input);
        const logs = toInline(log.mock.calls.flat().join(''));
        expect(logs).toContain(LOG_PREFIX.WARN);
        expect(
          toInline(logs.replaceAll(LOG_PREFIX.WARN, '')).replaceAll(' ', ''),
        ).toBe(
          toInline(`
        Ops! Warning:
        --------------------------
        ${boldLog(`The next effect function is async without an await:`)}

        effect(async () => { 
          if (propName.value) { 
            console.log("Hello world");
          }
        });

        It's recommended to await the async effects to avoid registration conflicts:

        await effect(async () => { 
          if (propName.value) { 
            console.log("Hello world");
          }
        });
        --------------------------
        Docs: https://brisa.build/building-your-application/components-details/web-components#effects-effect-method  
        `).replaceAll(' ', ''),
        );
        log.mockRestore();
      });
    });
  });
});
