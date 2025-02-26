import { describe, it, expect } from 'bun:test';
import getVarDeclarationIdentifiers from '.';
import type { ESTree } from 'meriyah';

describe('utils', () => {
  describe('ast', () => {
    describe('get-var-declaration-identifiers', () => {
      it('should not return any identifier if the given AST is not a VariableDeclaration pr FunctionDeclarator', () => {
        const node = {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'a' },
        };
        const output = getVarDeclarationIdentifiers(node as ESTree.Node);
        expect(output).toEqual(new Map<string, Set<string>>());
      });

      it('should return all identifiers in the given AST', () => {
        const node = {
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: 'a' },
              init: { type: 'Literal', value: 1 },
            },
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: 'b' },
              init: { type: 'Literal', value: 2 },
            },
          ],
          kind: 'const',
        };
        const output = getVarDeclarationIdentifiers(node as ESTree.Node);
        const expectedMap = new Map<string, Set<string>>([
          ['a', new Set()],
          ['b', new Set()],
        ]);
        expect(output).toEqual(expectedMap);
      });

      it('should return identifiers inside an ObjectPattern', () => {
        const node = {
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {
                type: 'ObjectPattern',
                properties: [
                  {
                    type: 'Property',
                    key: { type: 'Identifier', name: 'a' },
                    value: { type: 'Identifier', name: 'b' },
                  },
                  {
                    type: 'Property',
                    key: { type: 'Identifier', name: 'c' },
                    value: { type: 'Identifier', name: 'd' },
                  },
                ],
              },
              init: { type: 'Literal', value: 1 },
            },
          ],
          kind: 'const',
        };
        const output = getVarDeclarationIdentifiers(node as ESTree.Node);
        const expectedMap = new Map<string, Set<string>>([
          ['a', new Set(['b'])],
          ['c', new Set(['d'])],
        ]);
        expect(output).toEqual(expectedMap);
      });

      it('should return all identifiers in the given AST with nested structures', () => {
        const node = {
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: 'a' },
              init: { type: 'Literal', value: 1 },
            },
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: 'b' },
              init: { type: 'Literal', value: 2 },
            },
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: 'c' },
              init: {
                type: 'BinaryExpression',
                left: { type: 'Identifier', name: 'a' },
                operator: '+',
                right: { type: 'Identifier', name: 'b' },
              },
            },
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: 'd' },
              init: {
                type: 'ArrowFunctionExpression',
                params: [],
                body: {
                  type: 'BlockStatement',
                  body: [
                    {
                      type: 'VariableDeclaration',
                      declarations: [
                        {
                          type: 'VariableDeclarator',
                          id: { type: 'Identifier', name: 'e' },
                          init: { type: 'Literal', value: 3 },
                        },
                        {
                          type: 'VariableDeclarator',
                          id: { type: 'Identifier', name: 'f' },
                          init: { type: 'Literal', value: 4 },
                        },
                        {
                          type: 'VariableDeclarator',
                          id: { type: 'Identifier', name: 'g' },
                          init: {
                            type: 'BinaryExpression',
                            left: { type: 'Identifier', name: 'e' },
                            operator: '+',
                            right: { type: 'Identifier', name: 'f' },
                          },
                        },
                      ],
                      kind: 'const',
                    },
                  ],
                },
              },
            },
          ],
          kind: 'const',
        };
        const output = getVarDeclarationIdentifiers(node as ESTree.Node);
        const expectedMap = new Map<string, Set<string>>([
          ['a', new Set()],
          ['b', new Set()],
          ['c', new Set(['a', 'b'])],
          ['d', new Set(['e', 'f', 'g'])],
          ['e', new Set()],
          ['f', new Set()],
          ['g', new Set(['e', 'f'])],
        ]);
        expect(output).toEqual(expectedMap);
      });

      it('should return all identifiers from FunctionDeclaration', () => {
        const node = {
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'a' },
          params: [
            { type: 'Identifier', name: 'b' },
            { type: 'Identifier', name: 'c' },
          ],
          body: {
            type: 'BlockStatement',
            body: [
              {
                type: 'VariableDeclaration',
                declarations: [
                  {
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: 'd' },
                    init: { type: 'Literal', value: 1 },
                  },
                  {
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: 'e' },
                    init: { type: 'Literal', value: 2 },
                  },
                ],
                kind: 'const',
              },
              {
                type: 'ReturnStatement',
                argument: {
                  type: 'BinaryExpression',
                  left: { type: 'Identifier', name: 'd' },
                  operator: '+',
                  right: { type: 'Identifier', name: 'e' },
                },
              },
            ],
          },
        };
        const output = getVarDeclarationIdentifiers(node as ESTree.Node);
        const expectedMap = new Map<string, Set<string>>([
          ['a', new Set()],
          ['d', new Set()],
          ['e', new Set()],
        ]);
        expect(output).toEqual(expectedMap);
      });

      it('should add all condition dependencies when inside an IfStatement #712', () => {
        const node = {
          type: 'Program',
          body: [
            {
              type: 'VariableDeclaration',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: { type: 'Identifier', name: 'foo' },
                  init: { type: 'Literal', value: 0 },
                },
                {
                  type: 'VariableDeclarator',
                  id: { type: 'Identifier', name: 'bar' },
                  init: { type: 'Literal', value: 'hello world' },
                },
              ],
              kind: 'let',
            },
            {
              type: 'FunctionDeclaration',
              id: { type: 'Identifier', name: 'onAction' },
              params: [],
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'IfStatement',
                    test: {
                      type: 'BinaryExpression',
                      operator: '===',
                      left: { type: 'Identifier', name: 'bar' },
                      right: { type: 'Literal', value: 'foo' },
                    },
                    consequent: {
                      type: 'ExpressionStatement',
                      expression: {
                        type: 'AssignmentExpression',
                        operator: '=',
                        left: { type: 'Identifier', name: 'foo' },
                        right: { type: 'Literal', value: 1 },
                      },
                    },
                  },
                ],
              },
            },
          ],
        };

        const output = getVarDeclarationIdentifiers(node as ESTree.Node);

        const expectedMap = new Map<string, Set<string>>([
          ['foo', new Set()],
          ['bar', new Set(['foo'])],
          ['onAction', new Set()],
        ]);

        expect(output).toEqual(expectedMap);
      });
    });
  });
});
