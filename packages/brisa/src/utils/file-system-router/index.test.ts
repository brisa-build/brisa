import {
  fileSystemRouter,
  type MatchedBrisaRoute,
} from '@/utils/file-system-router';
import { describe, it, expect } from 'bun:test';
import path from 'node:path';

const dir = path.join(import.meta.dirname, '__fixtures__');

describe('utils', () => {
  describe('fileSystemRouter > resolve routes', () => {
    it('should resolve routes in the "nextjs" style', () => {
      const router = fileSystemRouter({
        dir,
        fileExtensions: ['.tsx', '.js', '.jsx'],
      });

      expect(router.routes).toEqual({
        '/': path.join(dir, 'index.tsx'),
        '/about-us': path.join(dir, 'about-us.tsx'),
        '/user/[username]': path.join(dir, 'user', '[username].tsx'),
        '/foo/[bar]': path.join(dir, 'foo', '[bar]', 'index.tsx'),
        '/rest/[...s]': path.join(dir, 'rest', '[...s].tsx'),
        '/rest2/[...s]': path.join(dir, 'rest2', '[...s]', 'index.tsx'),
        '/catchall/[[...catchAll]]': path.join(
          dir,
          'catchall',
          '[[...catchAll]].tsx',
        ),
        '/catchall2/[[...catchAll]]': path.join(
          dir,
          'catchall2',
          '[[...catchAll]]/index.tsx',
        ),
        '/nested/[user]/[foo]/[bar]/[baz]/[quux]': path.join(
          dir,
          'nested',
          '[user]',
          '[foo]',
          '[bar]',
          '[baz]',
          '[quux]',
          'index.js',
        ),
        '/nested2/[user]/[foo]/[bar]/[baz]/[quux]': path.join(
          dir,
          'nested2',
          '[user]',
          '[foo]',
          '[bar]',
          '[baz]',
          '[quux].jsx',
        ),
      });
    });

    it('should resolve only the tsx files', () => {
      const router = fileSystemRouter({
        dir,
        fileExtensions: ['.tsx'],
      });

      expect(router.routes).toEqual({
        '/': path.join(dir, 'index.tsx'),
        '/about-us': path.join(dir, 'about-us.tsx'),
        '/user/[username]': path.join(dir, 'user', '[username].tsx'),
        '/foo/[bar]': path.join(dir, 'foo', '[bar]', 'index.tsx'),
        '/rest/[...s]': path.join(dir, 'rest', '[...s].tsx'),
        '/rest2/[...s]': path.join(dir, 'rest2', '[...s]', 'index.tsx'),
        '/catchall/[[...catchAll]]': path.join(
          dir,
          'catchall',
          '[[...catchAll]].tsx',
        ),
        '/catchall2/[[...catchAll]]': path.join(
          dir,
          'catchall2',
          '[[...catchAll]]/index.tsx',
        ),
      });
    });

    it('should resolve only the js files', () => {
      const router = fileSystemRouter({
        dir,
        fileExtensions: ['.js'],
      });

      expect(router.routes).toEqual({
        '/nested/[user]/[foo]/[bar]/[baz]/[quux]': path.join(
          dir,
          'nested',
          '[user]',
          '[foo]',
          '[bar]',
          '[baz]',
          '[quux]',
          'index.js',
        ),
      });
    });

    it('should resolve only the jsx files', () => {
      const router = fileSystemRouter({
        dir,
        fileExtensions: ['.jsx'],
      });

      expect(router.routes).toEqual({
        '/nested2/[user]/[foo]/[bar]/[baz]/[quux]': path.join(
          dir,
          'nested2',
          '[user]',
          '[foo]',
          '[bar]',
          '[baz]',
          '[quux].jsx',
        ),
      });
    });
  });

  describe('fileSystemRouter > match', () => {
    const BATTERY_TESTS = [
      [
        '/',
        {
          filePath: path.join(dir, 'index.tsx'),
          kind: 'exact',
          name: '/',
          pathname: '/',
        },
      ],
      [
        '/about-us',
        {
          filePath: path.join(dir, 'about-us.tsx'),
          kind: 'exact',
          name: '/about-us',
          pathname: '/about-us',
        },
      ],
      [
        '/user/john',
        {
          filePath: path.join(dir, 'user', '[username].tsx'),
          kind: 'dynamic',
          name: '/user/[username]',
          pathname: '/user/john',
          params: {
            username: 'john',
          },
        },
      ],
      [
        '/foo/bar',
        {
          filePath: path.join(dir, 'foo', '[bar]', 'index.tsx'),
          kind: 'dynamic',
          name: '/foo/[bar]',
          pathname: '/foo/bar',
          params: {
            bar: 'bar',
          },
        },
      ],
      [
        '/rest/a/b/c',
        {
          filePath: path.join(dir, 'rest', '[...s].tsx'),
          kind: 'catch-all',
          name: '/rest/[...s]',
          pathname: '/rest/a/b/c',
          params: {
            s: ['a', 'b', 'c'],
          },
        },
      ],
      [
        '/rest2/a/b/c',
        {
          filePath: path.join(dir, 'rest2', '[...s]', 'index.tsx'),
          kind: 'catch-all',
          name: '/rest2/[...s]',
          pathname: '/rest2/a/b/c',
          params: {
            s: ['a', 'b', 'c'],
          },
        },
      ],
      [
        '/catchall/a/b/c',
        {
          filePath: path.join(dir, 'catchall', '[[...catchAll]].tsx'),
          kind: 'optional-catch-all',
          name: '/catchall/[[...catchAll]]',
          pathname: '/catchall/a/b/c',
          params: {
            catchAll: ['a', 'b', 'c'],
          },
        },
      ],
      [
        '/catchall2/a/b/c',
        {
          filePath: path.join(dir, 'catchall2', '[[...catchAll]]', 'index.tsx'),
          kind: 'optional-catch-all',
          name: '/catchall2/[[...catchAll]]',
          pathname: '/catchall2/a/b/c',
          params: {
            catchAll: ['a', 'b', 'c'],
          },
        },
        '/nested/john/foo/bar/baz/quux',
        {
          filePath: path.join(
            dir,
            'nested',
            '[user]',
            '[foo]',
            '[bar]',
            '[baz]',
            '[quux]',
            'index.js',
          ),
          kind: 'dynamic',
          name: '/nested/[user]/[foo]/[bar]/[baz]/[quux]',
          pathname: '/nested/john/foo/bar/baz/quux',
          params: {
            user: 'john',
            foo: 'foo',
            bar: 'bar',
            baz: 'baz',
            quux: 'quux',
          },
        },
        '/nested2/john/foo/bar/baz/quux',
        {
          filePath: path.join(
            dir,
            'nested',
            '[user]',
            '[foo]',
            '[bar]',
            '[baz]',
            '[quux].jsx',
          ),
          kind: 'dynamic',
          name: '/nested2/[user]/[foo]/[bar]/[baz]/[quux]',
          pathname: '/nested2/john/foo/bar/baz/quux',
          params: {
            user: 'john',
            foo: 'foo',
            bar: 'bar',
            baz: 'baz',
            quux: 'quux',
          },
        },
      ],
    ] as [string, MatchedBrisaRoute][];

    describe.each(BATTERY_TESTS)('match: %s', (filePath, expected) => {
      it(`should return ${expected.name}`, () => {
        const router = fileSystemRouter({
          dir,
          fileExtensions: ['.tsx', '.js', '.jsx'],
        });
        expect(router.match(filePath)).toEqual(expected as any);
      });
    });
  });
});
