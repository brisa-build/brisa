import { describe, it, expect } from 'bun:test';
import removeContentReturns from '.';
import type { ESTree } from 'meriyah';
import AST from '@/utils/ast';

const { parseCodeToAST } = AST('tsx');
const input = (text: string) =>
  (parseCodeToAST(text).body[0] as any).declaration.body;

describe('utils', () => {
  describe('ast', () => {
    describe('remove-content-returns', () => {
      it('should remove all return statements in the given AST', () => {
        const ast = input(`
          export default function Test() {
            return 'hello'
          }
        `);
        const output = removeContentReturns(ast);
        expect(output).toEqual(
          input(`
          export default function Test() {}
        `),
        );
      });

      it('should not remove the inner arrow function return because is not a content return', () => {
        const ast = input(`
          export default function Test() {
            const another = () => {
              return 'NO'
            }
            return 'hello'
          }
        `);
        const output = removeContentReturns(ast);
        expect(output).toEqual(
          input(`
          export default function Test() {
            const another = () => {
              return 'NO'
            }
          }
        `),
        );
      });

      it('should not remove the inner function return because is not a content return', () => {
        const ast = input(`
          export default function Test() {
            function another() {
              return 'NO'
            }
            return 'hello'
          }
        `);
        const output = removeContentReturns(ast);
        expect(output).toEqual(
          input(`
          export default function Test() {
            function another() {
              return 'NO'
            }
          }
        `),
        );
      });

      it('should not remove the inner async arrow function return because is not a content return', () => {
        const ast = input(`
          export default function Test() {
            const another = async () => {
              return 'NO'
            }
            return 'hello'
          }
        `);
        const output = removeContentReturns(ast);
        expect(output).toEqual(
          input(`
          export default function Test() {
            const another = async () => {
              return 'NO'
            }
          }
        `),
        );
      });

      it('should not remove the inner async function return because is not a content return', () => {
        const ast = input(`
          export default function Test() {
            async function another() {
              return 'NO'
            }
            return 'hello'
          }
        `);
        const output = removeContentReturns(ast);
        expect(output).toEqual(
          input(`
          export default function Test() {
            async function another() {
              return 'NO'
            }
          }
        `),
        );
      });

      it('should remove different returns with different if-else-if', () => {
        const ast = input(`
          export default function Test() {
            if (foo) return 'foo';
            else if (bar) return 'bar';
            return 'hello';
          }
        `);
        const output = removeContentReturns(ast);
        expect(output).toEqual(
          input(`
          export default function Test() {
            if (foo) {}
            else if (bar) {}
          }
        `),
        );
      });
    });
  });
});
