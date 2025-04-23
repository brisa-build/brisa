import { describe, it, expect } from 'bun:test';
import getContentReturns from '.';
import type { ESTree } from 'meriyah';
import AST from '@/utils/ast';

const { parseCodeToAST } = AST('tsx');
const input = (text: string) =>
  (parseCodeToAST(text).body[0] as any).declaration.body;

describe('utils', () => {
  describe('ast', () => {
    describe('get-content-returns', () => {
      it('should return all return statements in the given AST', () => {
        const ast = input(`
          export default function Test() {
            return 'hello'
          }
        `);
        const output = getContentReturns(ast);
        expect(output).toEqual(
          new Set<ESTree.ReturnStatement>([
            {
              argument: {
                type: 'Literal',
                value: 'hello',
              },
              type: 'ReturnStatement',
            },
          ]),
        );
      });

      it('should not return the inner arrow function return because is not a content return', () => {
        const ast = input(`
          export default function Test() {
            const another = () => {
              return 'NO'
            }
            return 'hello'
          }
        `);
        const output = getContentReturns(ast);
        expect(output).toEqual(
          new Set<ESTree.ReturnStatement>([
            {
              argument: {
                type: 'Literal',
                value: 'hello',
              },
              type: 'ReturnStatement',
            },
          ]),
        );
      });

      it('should not return the inner function return because is not a content return', () => {
        const ast = input(`
          export default function Test() {
            function another() {
              return 'NO'
            }
            return 'hello'
          }
        `);
        const output = getContentReturns(ast);
        expect(output).toEqual(
          new Set<ESTree.ReturnStatement>([
            {
              argument: {
                type: 'Literal',
                value: 'hello',
              },
              type: 'ReturnStatement',
            },
          ]),
        );
      });

      it('should not return the inner async arrow function return because is not a content return', () => {
        const ast = input(`
          export default function Test() {
            const another = async () => {
              return 'NO'
            }
            return 'hello'
          }
        `);
        const output = getContentReturns(ast);
        expect(output).toEqual(
          new Set<ESTree.ReturnStatement>([
            {
              argument: {
                type: 'Literal',
                value: 'hello',
              },
              type: 'ReturnStatement',
            },
          ]),
        );
      });

      it('should not return the inner async function return because is not a content return', () => {
        const ast = input(`
          export default function Test() {
            async function another() {
              return 'NO'
            }
            return 'hello'
          }
        `);
        const output = getContentReturns(ast);
        expect(output).toEqual(
          new Set<ESTree.ReturnStatement>([
            {
              argument: {
                type: 'Literal',
                value: 'hello',
              },
              type: 'ReturnStatement',
            },
          ]),
        );
      });

      it('should return different returns with different if-else-if', () => {
        const ast = input(`
          export default function Test() {
            if (foo) return 'foo';
            else if (bar) return 'bar';
            return 'hello';
          }
        `);
        const output = getContentReturns(ast);
        expect(output).toEqual(
          new Set<ESTree.ReturnStatement>([
            {
              argument: {
                type: 'Literal',
                value: 'foo',
              },
              type: 'ReturnStatement',
            },
            {
              argument: {
                type: 'Literal',
                value: 'bar',
              },
              type: 'ReturnStatement',
            },
            {
              argument: {
                type: 'Literal',
                value: 'hello',
              },
              type: 'ReturnStatement',
            },
          ]),
        );
      });
    });
  });
});
