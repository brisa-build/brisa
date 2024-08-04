import getWebComponentsPerEntryPoints from '@/utils/ast/get-webcomponents-per-entrypoints';
import { it, describe, expect } from 'bun:test';

describe('utils', () => {
  describe('ast', () => {
    describe('get-webcomponents-per-entrypoints', () => {
      it('should return a list with the web components per entry points', () => {
        const webComponentsPerFile = {
          '/path/to/file.tsx': {
            'web-component': '/path/to/web-component.tsx',
          },
        };
        const dependenciesPerFile = new Map<string, Set<string>>([
          ['/path/to/file.tsx', new Set(['/path/to/web-component.tsx'])],
          ['/path/to/web-component.tsx', new Set()],
        ]);
        const entrypoints = ['/path/to/file.tsx'];
        const result = getWebComponentsPerEntryPoints(
          webComponentsPerFile,
          dependenciesPerFile,
          entrypoints,
        );

        expect(result).toEqual({
          '/path/to/file.js': {
            'web-component': '/path/to/web-component.tsx',
          },
        });
      });

      it('should relationate correctly a web component path with "import:" prefix and a dependency path without "import:" prefix', () => {
        const webComponentsPerFile = {
          '/path/to/file.tsx': {
            'web-component': 'import:/path/to/web-component.tsx',
          },
        };
        const dependenciesPerFile = new Map<string, Set<string>>([
          ['/path/to/file.tsx', new Set(['/path/to/web-component.tsx'])],
          ['/path/to/web-component.tsx', new Set()],
        ]);
        const entrypoints = ['/path/to/file.tsx'];
        const result = getWebComponentsPerEntryPoints(
          webComponentsPerFile,
          dependenciesPerFile,
          entrypoints,
        );

        expect(result).toEqual({
          '/path/to/file.js': {
            'web-component': 'import:/path/to/web-component.tsx',
          },
        });
      });

      it('should resolve correctly the dependencies', () => {
        const webComponentsPerFile = {
          '/path/to/file.tsx': {
            'web-component': '/path/to/web-component.tsx',
          },
          '/path/to/another.tsx': {
            'web-component-2': '/path/to/web-component-2.tsx',
          },
        };
        const dependenciesPerFile = new Map<string, Set<string>>([
          ['/path/to/file.tsx', new Set(['/path/to/foo.tsx'])],
          ['/path/to/foo.tsx', new Set(['/path/to/web-component.tsx'])],
          ['/path/to/another.tsx', new Set(['/path/to/web-component-2.tsx'])],
        ]);
        const entrypoints = ['/path/to/file.tsx', '/path/to/another.tsx'];
        const result = getWebComponentsPerEntryPoints(
          webComponentsPerFile,
          dependenciesPerFile,
          entrypoints,
        );

        expect(result).toEqual({
          '/path/to/file.js': {
            'web-component': '/path/to/web-component.tsx',
          },
          '/path/to/another.js': {
            'web-component-2': '/path/to/web-component-2.tsx',
          },
        });
      });

      it('should resolve multiple dependencies', () => {
        const webComponentsPerFile = {
          '/src/pages/page-without-web-component.js': {},
          '/src/pages/index.js': {},
          '/src/components/foo.js': {},
          '/src/components/bar.js': {},
          '/src/components/baz.js': {
            'some-counter': '/src/web-components/some-counter.tsx',
          },
          '/src/web-components/some-counter.js': {},
        };
        const dependenciesPerFile = new Map<string, Set<string>>([
          ['/src/pages/page-without-web-component.tsx', new Set()],
          ['/src/pages/index.tsx', new Set(['/src/components/foo.tsx'])],
          ['/src/components/foo.tsx', new Set(['/src/components/bar.tsx'])],
          ['/src/components/bar.tsx', new Set(['/src/components/baz.tsx'])],
          [
            '/src/components/baz.tsx',
            new Set(['/src/web-components/some-counter.tsx']),
          ],
          ['/src/web-components/some-counter.tsx', new Set()],
        ]);
        const entrypoints = [
          '/src/pages/page-without-web-component.tsx',
          '/src/pages/index.tsx',
        ];

        const result = getWebComponentsPerEntryPoints(
          webComponentsPerFile,
          dependenciesPerFile,
          entrypoints,
        );

        expect(result).toEqual({
          '/src/pages/index.js': {
            'some-counter': '/src/web-components/some-counter.tsx',
          },
        });
      });

      it('should work with different path separator when webComponentPerFile arrives with import:/', () => {
        const separator = '\\';
        const webComponentsPerFile = {
          '\\path\\to\\file.tsx': {
            'web-component': 'import:/path/to/web-component.tsx',
          },
        };

        const dependenciesPerFile = new Map<string, Set<string>>([
          ['\\path\\to\\file.tsx', new Set(['\\path\\to\\foo.tsx'])],
          ['\\path\\to\\foo.tsx', new Set(['\\path\\to\\web-component.tsx'])],
        ]);

        const entrypoints = ['\\path\\to\\file.tsx'];

        const result = getWebComponentsPerEntryPoints(
          webComponentsPerFile,
          dependenciesPerFile,
          entrypoints,
          separator,
        );

        expect(result).toEqual({
          '\\path\\to\\file.js': {
            'web-component': 'import:/path/to/web-component.tsx',
          },
        });
      });
    });
  });
});
