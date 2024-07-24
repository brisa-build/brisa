import { describe, expect, it } from 'bun:test';
import type { ESTree } from 'meriyah';
import mergeEarlyReturnsInOne from '.';
import { normalizeQuotes } from '@/helpers';
import AST from '@/utils/ast';
import getWebComponentAst from '../get-web-component-ast';

const { parseCodeToAST, generateCodeFromAST } = AST();
const toOutput = (code: string) => {
  const reactiveAst = parseCodeToAST(code);
  const [componentBranch, index] = getWebComponentAst(reactiveAst);
  const outputComponentAst = mergeEarlyReturnsInOne(componentBranch as ESTree.FunctionDeclaration);

  (reactiveAst.body[index as number] as any).declaration = outputComponentAst;

  return normalizeQuotes(generateCodeFromAST(reactiveAst));
};

describe('utils', () => {
  describe('client-build-plugin', () => {
    describe('merge-early-returns-in-one', () => {
      it("should not merge when an if doesn't have a return statement", () => {
        const input = `
          export default function Component({ propName }) {
            if (propName.value) {
              console.log('Hello world');
            }
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            if (propName.value) {
              console.log('Hello world');
            }
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should not merge when an if-elseif-else doesn't have a return statement", () => {
        const input = `
          export default function Component({ propName }) {
            if (propName.value) {
              console.log('Hello world');
            } else if (propName.value) {
              console.log('Hello world');
            } else {
              console.log('Hello world');
            }
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            if (propName.value) {
              console.log('Hello world');
            } else if (propName.value) {
              console.log('Hello world');
            } else {
              console.log('Hello world');
            }
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should not merge when an switch doesn't have a return statement", () => {
        const input = `
          export default function Component({ propName }) {
            switch (propName.value) {
              case 'a':
                console.log('Hello world');
              case 'b':
                console.log('Hello world');
              default:
                console.log('Hello world');
            }
          
            return ['span', {}, 'Hello world']
          }
        `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            switch (propName.value) {
              case 'a':
                console.log('Hello world');
              case 'b':
                console.log('Hello world');
              default:
                console.log('Hello world');
            }
          
            return ['span', {}, 'Hello world'];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should merge early returns in one', () => {
        const input = `
        export default function Component({ propName }) {
          if (propName.value) {
            return ['div', {}, '']
          }
        
          return ['span', {}, '']
        }
      `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            return [null, {}, () => {
              if (propName.value) {
                return ['div', {}, ''];
              }
            
              return ['span', {}, ''];
            }];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should merge early returns in one when there are multi if-elseif-else', () => {
        const input = `
          export default function Component({ propName }) {
            if (propName.value) {
              return ['div', {}, '']
            } else if (propName.value) {
              return ['span', {}, '']
            } else {
              return ['p', {}, '']
            }
          }
        `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            return [null, {}, () => {
              if (propName.value) {
                return ['div', {}, ''];
              } else if (propName.value) {
                return ['span', {}, ''];
              } else {
                return ['p', {}, ''];
              }
            }];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should work with a very nested early return', () => {
        const input = `
          export default function Component({ propName }) {
            if (propName.value.startsWith('a')) {
              if(propName.value[1] === 'b') {
                if(propName.value[2] === 'c') {
                  return ['div', {}, '']
                }
              }
            }

            return ['span', {}, 'Hello world']
          }
        `;

        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            return [null, {}, () => {
              if (propName.value.startsWith('a')) {
                if (propName.value[1] === 'b') {
                  if (propName.value[2] === 'c') {
                    return ['div', {}, ''];
                  }
                }
              }

              return ['span', {}, 'Hello world'];
            }];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should work with a switch statement', () => {
        const input = `
          export default function Component({ propName }) {
            switch (propName.value) {
              case 'a':
                return ['div', {}, '']
              case 'b':
                return ['span', {}, '']
              default:
                return ['p', {}, '']
            }
          }
        `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            return [null, {}, () => {
              switch (propName.value) {
                case 'a':
                  return ['div', {}, ''];
                case 'b':
                  return ['span', {}, ''];
                default:
                  return ['p', {}, ''];
              }
            }];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should work with a switch-case with block statements', () => {
        const input = `
          export default function Component({ propName }) {
            switch (propName.value) {
              case 'a': {
                return ['div', {}, '']
              }
              case 'b': {
                return ['span', {}, '']
              }
              default: {
                return ['p', {}, '']
              }
            }
          }
        `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            return [null, {}, () => {
              switch (propName.value) {
                case 'a':{
                  return ['div', {}, ''];
                }
                case 'b':{
                  return ['span', {}, ''];
                }
                default:{
                  return ['p', {}, ''];
                }
              }
            }];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should work with a mix between if-else and switch-case and final return', () => {
        const input = `
          export default function Component({ propName }) {
            if (propName.value === 'a') {
              return ['div', {}, '']
            } else if (propName.value === 'b') {
              switch (propName.value) {
                case 'c':
                  return ['span', {}, '']
                default:
                  return ['p', {}, '']
              }
            } else {
              return ['p', {}, '']
            }
          }
        `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            return [null, {}, () => {
              if (propName.value === 'a') {
                return ['div', {}, ''];
              } else if (propName.value === 'b') {
                switch (propName.value) {
                  case 'c':
                    return ['span', {}, ''];
                  default:
                    return ['p', {}, ''];
                }
              } else {
                return ['p', {}, ''];
              }
            }];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should not include code before the first early return inside the array of the final return', () => {
        const input = `
          export default function Component({ propName }, { state, effect }) {
            const user = state({ name: 'Aral' });
            const a = 1;
            const b = 2;

            effect(() => {
              console.log('Hello world' + user.value.name);
            });
          
            if (propName.value) {
              return ['div', {}, () => user.value.name]
            }
          
            return ['span', {}, a + b];
          }
          `;

        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}, {state, effect}) {
            const user = state({name: 'Aral'});
            const a = 1;
            const b = 2;
          
            effect(() => {
              console.log('Hello world' + user.value.name);
            });
          
            return [null, {}, () => {
              if (propName.value) {
                return ['div', {}, () => user.value.name];
              }
          
              return ['span', {}, a + b];
            }];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should work when an if doesn't have a return statement but an else if yes", () => {
        const input = `
          export default function Component({ propName }) {
            if (propName.value === 'a') {
              console.log('Hello world');
            } else if (propName.value === 'b') {
              return ['span', {}, '']
            } else {
              return ['p', {}, '']
            }
          }
        `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            return [null, {}, () => {
              if (propName.value === 'a') {
                console.log('Hello world');
              } else if (propName.value === 'b') {
                return ['span', {}, ''];
              } else {
                return ['p', {}, ''];
              }
            }];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should work when an if doesn't have a return statement but an else if yes and an else if not", () => {
        const input = `
          export default function Component({ propName }) {
            if (propName.value === 'a') {
              console.log('Hello world');
            } else if (propName.value === 'b') {
              return ['span', {}, '']
            } else if (propName.value === 'c') {
              console.log('Hello world');
            } else {
              return ['p', {}, '']
            }
          }
        `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            return [null, {}, () => {
              if (propName.value === 'a') {
                console.log('Hello world');
              } else if (propName.value === 'b') {
                return ['span', {}, ''];
              } else if (propName.value === 'c') {
                console.log('Hello world');
              } else {
                return ['p', {}, ''];
              }
            }];
          }
        `);

        expect(output).toEqual(expected);
      });

      it("should work when a switch doesn't have a return statement in the first case but yes in the second", () => {
        const input = `
          export default function Component({ propName }) {
            switch (propName.value) {
              case 'a':
                console.log('Hello world');
              case 'b':
                return ['span', {}, '']
              default:
                return ['p', {}, '']
            }
          }
        `;
        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            return [null, {}, () => {
              switch (propName.value) {
                case 'a':
                  console.log('Hello world');
                case 'b':
                  return ['span', {}, ''];
                default:
                  return ['p', {}, ''];
              }
            }];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should work when an if is declaring an arrow function with a return statement inside', () => {
        const input = `
          export default function Component({ propName }) {
            if (propName.value) {
              const fn = () => {
                return ['div', {}, '']
              }
            }
          
            return ['span', {}, '']
          }
        `;
        const output = toOutput(input);
        const expected = `export default function Component({propName}) {if (propName.value) {const fn = () => {return ["div", {}, ""];};}return ["span", {}, ""];}`;

        expect(output).toEqual(expected);
      });

      it('should work when an if is declaring an function with a return statement inside', () => {
        const input = `
        export default function Component({ propName }) {
          if (propName.value) {
            function fn() {
              return ['div', {}, '']
            }
          }
        
          return ['span', {}, '']
        }
      `;

        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            if (propName.value) {
              let fn = function () {
                return ['div', {}, ''];
              };
            }
          
            return ['span', {}, ''];
          }
        `);

        expect(output).toEqual(expected);
      });

      it('should not merge when there is a map inside a condition', () => {
        const input = `
        export default function Component({ propName }) {
          let example = ['a', 'b', 'c'];

          if (propName.value === 'a') {
            example = example.map(item => {
              return ['b', {}, item]
            })
          }
        
          return example
        }
      `;

        const output = toOutput(input);
        const expected = normalizeQuotes(`
          export default function Component({propName}) {
            let example = ['a', 'b', 'c'];
          
            if (propName.value === 'a') {
              example = example.map(item => {
                return ['b', {}, item];
              });
            }
          
            return example;
          }
        `);

        expect(output).toEqual(expected);
      });
    });
  });
});
