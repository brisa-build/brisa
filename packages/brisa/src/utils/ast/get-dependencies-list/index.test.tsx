import getDependenciesMap from '@/utils/ast/get-dependencies-list';
import { expect, it, describe, afterEach } from 'bun:test';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ESTree } from 'meriyah';
import { getConstants } from '@/constants';

describe('utils', () => {
  afterEach(() => {
    globalThis.mockConstants = undefined;
  });
  describe('ast', () => {
    describe('get-dependencies-list', () => {
      it('should return a list with the dependencies of the given ast', () => {
        const ast = {
          type: 'Program',
          body: [
            {
              type: 'ImportDeclaration',
              specifiers: [
                {
                  type: 'ImportDefaultSpecifier',
                  local: { type: 'Identifier', name: 'foo' },
                },
              ],
              source: { type: 'Literal', value: './index.tsx' },
            },
          ],
        } as ESTree.Program;

        const path = join('path', 'to', 'file.tsx');
        const deps = getDependenciesMap(ast, path);

        expect(deps).toEqual(new Set([sep + join('path', 'to', 'index.tsx')]));
      });

      it('should support initial value as 3th argument', () => {
        const ast = {
          type: 'Program',
          body: [
            {
              type: 'ImportDeclaration',
              specifiers: [
                {
                  type: 'ImportDefaultSpecifier',
                  local: { type: 'Identifier', name: 'foo' },
                },
              ],
              source: { type: 'Literal', value: './index.tsx' },
            },
          ],
        } as ESTree.Program;

        const path = join('path', 'to', 'file.tsx');
        const initialValue = new Set([join(sep, 'path', 'to', 'initial.tsx')]);
        const deps = getDependenciesMap(ast, path, initialValue);

        expect(deps).toEqual(
          new Set([
            sep + join('path', 'to', 'initial.tsx'),
            sep + join('path', 'to', 'index.tsx'),
          ]),
        );
      });

      it('should return a list with the dependencies of the given ast with multiple imports', () => {
        const ast = {
          type: 'Program',
          body: [
            {
              type: 'ImportDeclaration',
              specifiers: [
                {
                  type: 'ImportDefaultSpecifier',
                  local: { type: 'Identifier', name: 'foo' },
                },
              ],
              source: { type: 'Literal', value: './index.tsx' },
            },
            {
              type: 'ImportDeclaration',
              specifiers: [
                {
                  type: 'ImportDefaultSpecifier',
                  local: { type: 'Identifier', name: 'bar' },
                },
              ],
              source: { type: 'Literal', value: './bar.tsx' },
            },
          ],
        } as ESTree.Program;

        const path = join('path', 'to', 'file.tsx');
        const deps = getDependenciesMap(ast, path);

        expect(deps).toEqual(
          new Set([
            sep + join('path', 'to', 'index.tsx'),
            sep + join('path', 'to', 'bar.tsx'),
          ]),
        );
      });

      it('should work with named imports', () => {
        const ast = {
          type: 'Program',
          body: [
            {
              type: 'ImportDeclaration',
              specifiers: [
                {
                  type: 'ImportSpecifier',
                  imported: { type: 'Identifier', name: 'foo' },
                  local: { type: 'Identifier', name: 'foo' },
                },
              ],
              source: { type: 'Literal', value: './index.tsx' },
            },
          ],
        } as ESTree.Program;

        const path = join('path', 'to', 'file.tsx');
        const deps = getDependenciesMap(ast, path);

        expect(deps).toEqual(new Set([sep + join('path', 'to', 'index.tsx')]));
      });

      it('should return absoulte import specifiers when CONFIG.output is Node.js', () => {
        const ast = {
          type: 'Program',
          body: [
            {
              type: 'ImportDeclaration',
              specifiers: [
                {
                  type: 'ImportSpecifier',
                  imported: { type: 'Identifier', name: 'foo' },
                  local: { type: 'Identifier', name: 'foo' },
                },
              ],
              source: { type: 'Literal', value: './index.tsx' },
            },
          ],
        } as ESTree.Program;
        globalThis.mockConstants = {
          ...getConstants(),
          CONFIG: { output: 'node' },
        };
        const path = join('path', 'to', 'file.tsx');
        const deps = getDependenciesMap(ast, path);
        const expected = pathToFileURL(
          sep + join('path', 'to', 'index.tsx'),
        ).href;

        expect(deps).toEqual(new Set([expected]));
      });
    });
  });
});
