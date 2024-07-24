import { describe, it, expect } from 'bun:test';
import removeAllReturns from '.';
import type { ESTree } from 'meriyah';

describe('utils', () => {
  describe('ast', () => {
    describe('remove-all-returns', () => {
      it('should remove all return statements in the given AST', () => {
        const returnStatement = {
          type: 'ReturnStatement',
          argument: { type: 'Literal', value: 'hello' },
        };
        const ast = {
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'Test' },
          params: [],
          body: {
            type: 'BlockStatement',
            body: [returnStatement],
          },
        } as unknown as ESTree.Statement[];
        const output = removeAllReturns(ast);
        expect(output).toEqual({
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'Test' },
          params: [],
          body: {
            type: 'BlockStatement',
            body: [],
          },
        } as unknown as ESTree.Statement[]);
      });

      it('should remove all return statements in the given AST with nested structures', () => {
        const returnStatement = {
          type: 'ReturnStatement',
          argument: { type: 'Literal', value: 'hello' },
        };
        const ast = {
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'Test' },
          params: [],
          body: {
            type: 'BlockStatement',
            body: [
              returnStatement,
              {
                type: 'FunctionDeclaration',
                id: { type: 'Identifier', name: 'Test' },
                params: [],
                body: {
                  type: 'BlockStatement',
                  body: [returnStatement],
                },
              },
            ],
          },
        };
        const output = removeAllReturns(ast as unknown as ESTree.Statement[]);
        expect(output).toEqual({
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'Test' },
          params: [],
          body: {
            type: 'BlockStatement',
            body: [
              {
                type: 'FunctionDeclaration',
                id: { type: 'Identifier', name: 'Test' },
                params: [],
                body: {
                  type: 'BlockStatement',
                  body: [],
                },
              },
            ],
          },
        } as unknown as ESTree.Statement[]);
      });
    });
  });
});
