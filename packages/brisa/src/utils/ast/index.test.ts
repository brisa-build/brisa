import { describe, it, expect, spyOn } from 'bun:test';
import AST from '.';

describe('utils', () => {
  describe('AST', () => {
    it('should parse JS code to ast', () => {
      const ast = AST('js').parseCodeToAST('const a = 1;');
      expect(ast).toEqual({
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: { type: 'Identifier', name: 'a' },
                init: { type: 'Literal', value: 1 },
              },
            ],
          },
        ],
      });
    });

    it('should parse TS code to ast', () => {
      const ast = AST('ts').parseCodeToAST('const a: number = 1;');
      expect(ast).toEqual({
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: {
                  type: 'Identifier',
                  name: 'a',
                },
                init: {
                  type: 'Literal',
                  value: 1,
                },
              },
            ],
          },
        ],
      });
    });

    it('should parse ast to code', () => {
      const code = AST('js').generateCodeFromAST({
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: { type: 'Identifier', name: 'a' },
                init: { type: 'Literal', value: 1 },
              },
            ],
          },
        ],
      });

      expect(code.trim()).toEqual('const a = 1;');
    });

    it('should log error when parsing code to ast fails', () => {
      const mockLog = spyOn(console, 'log');
      const ast = AST('ts').parseCodeToAST('const await = 123');
      expect(ast).toEqual({ type: 'Program', body: [] } as any);
      expect(mockLog.mock.calls.toString()).toContain(
        'Error parsing code to AST:',
      );
    });
  });
});
