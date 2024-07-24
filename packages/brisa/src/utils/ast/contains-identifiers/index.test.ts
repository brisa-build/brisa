import { describe, it, expect } from 'bun:test';
import containsIdentifiers from '.';

describe('utils', () => {
  describe('ast', () => {
    describe('contains-identifiers', () => {
      it('should return true if the AST contains the given identifiers', () => {
        const output = containsIdentifiers({ type: 'Identifier', name: 'a' }, new Set(['a']));
        expect(output).toBeTrue();
      });

      it('should return false if the AST does not contain the given identifiers', () => {
        const output = containsIdentifiers({ type: 'Identifier', name: 'a' }, new Set(['b']));
        expect(output).toBeFalse();
      });

      it('should return true if the AST contains the given identifiers in a nested structure', () => {
        const output = containsIdentifiers(
          {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'a' },
          } as any,
          new Set(['a']),
        );
        expect(output).toBeTrue();
      });

      it('should return false if the AST does not contain the given identifiers in a nested structure', () => {
        const output = containsIdentifiers(
          {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'a' },
          } as any,
          new Set(['b']),
        );
        expect(output).toBeFalse();
      });

      it('should avoid "await fetch(url)" even containing identifiers', () => {
        const output = containsIdentifiers(
          {
            type: 'AwaitExpression',
            argument: { type: 'Identifier', name: 'a' },
          } as any,
          new Set(['a']),
        );
        expect(output).toBeFalse();
      });

      it('should avoid "someMagicFunction(foo)" even containing identifiers', () => {
        const output = containsIdentifiers(
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'someMagicFunction' },
              arguments: [{ type: 'Identifier', name: 'foo' }],
            },
          } as any,
          new Set(['foo']),
        );
        expect(output).toBeFalse();
      });

      it('should keep "const response = await fetch(url)", if "response" is in the identifiers', () => {
        const output = containsIdentifiers(
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: { type: 'Identifier', name: 'response' },
                init: {
                  type: 'AwaitExpression',
                  argument: { type: 'Identifier', name: 'a' },
                },
              },
            ],
          } as any,
          new Set(['response']),
        );
        expect(output).toBeTrue();
      });

      it('should keep "const some = someMagicFunction(foo)", if "some" is in the identifiers', () => {
        const output = containsIdentifiers(
          {
            type: 'VariableDeclaration',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: { type: 'Identifier', name: 'some' },
                init: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'someMagicFunction' },
                  arguments: [{ type: 'Identifier', name: 'foo' }],
                },
              },
            ],
          } as any,
          new Set(['some']),
        );
        expect(output).toBeTrue();
      });
    });
  });
});
