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
    const SAME_AS_BUN_FILESYSTEMROUTER = [
      '/',
      '/user/john',
      '/foo/bar',
      '/rest/a/b/c',
      '/rest2/a/b/c',
      '/catchall/a/b/c',
      '/catchall2/a/b/c',
      '/nested/john/foo/bar/baz/quux',
      '/nested2/john/foo/bar/baz/quux',
      // With trailing slash:
      '/',
      '/user/john/',
      '/foo/bar/',
      '/rest/a/b/c/',
      '/rest2/a/b/c/',
      '/catchall/a/b/c/',
      '/catchall2/a/b/c/',
      '/nested/john/foo/bar/baz/quux/',
      '/nested2/john/foo/bar/baz/quux/',
    ];

    const fixBunParams = (obj: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key,
          value.includes('/') ? value.split('/') : value,
        ]),
      );

    it.each(SAME_AS_BUN_FILESYSTEMROUTER)(
      'should match: %s with Bun.FileSystemRouter',
      (filePath) => {
        const options = {
          dir,
          fileExtensions: ['.tsx', '.js', '.jsx'],
        };
        const router = fileSystemRouter(options);
        const output = router.match(filePath);
        const bunRouter = new Bun.FileSystemRouter({
          style: 'nextjs',
          ...options,
        });
        const expectedMatch = bunRouter.match(filePath);
        const expected = expectedMatch
          ? {
              filePath: expectedMatch.filePath,
              kind: expectedMatch.kind,
              name: expectedMatch.name,
              pathname: expectedMatch.pathname,
              params: fixBunParams(expectedMatch.params),
              query: fixBunParams(expectedMatch.query),
            }
          : null;

        expect(output).toEqual(expected);
      },
    );
  });
});
