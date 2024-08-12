import type { MatchedBrisaRoute } from '@/types';
import { fileSystemRouter } from '@/utils/file-system-router';
import { describe, it, expect } from 'bun:test';
import path from 'node:path';

const dir = path.join(import.meta.dirname, '__fixtures__');

describe('utils', () => {
  describe('fileSystemRouter > resolve routes', () => {
    it('should resolve tsx, js and jsx by default without fileExtensions', () => {
      const router = fileSystemRouter({ dir });

      expect(router.routes).toEqual({
        '/': path.join(dir, 'index.tsx'),
        '/about-us': path.join(dir, 'about-us.tsx'),
        '/user/[username]': path.join(dir, 'user', '[username].tsx'),
        '/foo/[bar]': path.join(dir, 'foo', '[bar]', 'index.tsx'),
        '/[test]/a': path.join(dir, '[test]', 'a', 'index.js'),
        '/[test]/a/[test2]/lala': path.join(
          dir,
          '[test]',
          'a',
          '[test2]',
          'lala.js',
        ),
        '/rest/[...s]': path.join(dir, 'rest', '[...s].tsx'),
        '/rest2/[...s]': path.join(dir, 'rest2', '[...s]', 'index.tsx'),
        '/admin/[businessId]/providers/[providerId]/delete': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          '[providerId]',
          'delete.tsx',
        ),
        '/admin/[businessId]/providers/[providerId]/edit': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          '[providerId]',
          'edit.tsx',
        ),
        '/admin/[businessId]/providers/create': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          'create.tsx',
        ),
        '/admin/[businessId]': path.join(
          dir,
          'admin',
          '[businessId]',
          'index.tsx',
        ),
        '/admin/[businessId]/providers': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          'index.tsx',
        ),
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

    it('should resolve routes using fileExtensions', () => {
      const router = fileSystemRouter({
        dir,
        fileExtensions: ['.tsx', '.js', '.jsx'],
      });

      expect(router.routes).toEqual({
        '/': path.join(dir, 'index.tsx'),
        '/about-us': path.join(dir, 'about-us.tsx'),
        '/user/[username]': path.join(dir, 'user', '[username].tsx'),
        '/foo/[bar]': path.join(dir, 'foo', '[bar]', 'index.tsx'),
        '/[test]/a': path.join(dir, '[test]', 'a', 'index.js'),
        '/[test]/a/[test2]/lala': path.join(
          dir,
          '[test]',
          'a',
          '[test2]',
          'lala.js',
        ),
        '/rest/[...s]': path.join(dir, 'rest', '[...s].tsx'),
        '/rest2/[...s]': path.join(dir, 'rest2', '[...s]', 'index.tsx'),
        '/admin/[businessId]/providers/[providerId]/delete': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          '[providerId]',
          'delete.tsx',
        ),
        '/admin/[businessId]/providers/[providerId]/edit': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          '[providerId]',
          'edit.tsx',
        ),
        '/admin/[businessId]/providers/create': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          'create.tsx',
        ),
        '/admin/[businessId]': path.join(
          dir,
          'admin',
          '[businessId]',
          'index.tsx',
        ),
        '/admin/[businessId]/providers': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          'index.tsx',
        ),
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
        '/admin/[businessId]/providers/[providerId]/delete': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          '[providerId]',
          'delete.tsx',
        ),
        '/admin/[businessId]/providers/[providerId]/edit': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          '[providerId]',
          'edit.tsx',
        ),
        '/admin/[businessId]/providers/create': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          'create.tsx',
        ),
        '/admin/[businessId]': path.join(
          dir,
          'admin',
          '[businessId]',
          'index.tsx',
        ),
        '/admin/[businessId]/providers': path.join(
          dir,
          'admin',
          '[businessId]',
          'providers',
          'index.tsx',
        ),
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
        '/[test]/a': path.join(dir, '[test]', 'a', 'index.js'),
        '/[test]/a/[test2]/lala': path.join(
          dir,
          '[test]',
          'a',
          '[test2]',
          'lala.js',
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
      '/catchall/a/b/cc/dd/eee',
      '/catchall2/a/b/c',
      '/nested/john/foo/bar/baz/quux',
      '/nested2/john/foo/bar/baz/quux',
      '/admin/1',
      '/admin/1/providers',
      '/admin/1/providers/2/delete',
      '/admin/1/providers/2/edit',
      '/admin/1/providers/create',

      // With trailing slash:
      '/user/john/',
      '/foo/bar/',
      '/rest/a/b/c/',
      '/rest2/a/b/c/',
      '/catchall/a/b/c/',
      '/catchall/a/b/cc/dd/eee/',
      '/catchall2/a/b/c/',
      '/nested/john/foo/bar/baz/quux/',
      '/nested2/john/foo/bar/baz/quux/',
      '/admin/1/',
      '/admin/1/providers/',
      '/admin/1/providers/2/delete/',
      '/admin/1/providers/2/edit/',
      '/admin/1/providers/create/',
    ];

    const DIFFERENT_THAN_BUN_FILESYSTEMROUTER = [
      [
        '/fdsgsdfg/a',
        {
          filePath: path.join(dir, '[test]', 'a', 'index.js'),
          kind: 'dynamic',
          name: '/[test]/a',
          pathname: '/fdsgsdfg/a',
          params: {
            test: 'fdsgsdfg',
          },
          query: {
            test: 'fdsgsdfg',
          },
          src: path.join('[test]', 'a', 'index.js'),
        },
      ],
    ] as [string, MatchedBrisaRoute][];

    // There are some bugs in the Bun.FileSystemRouter that we need to fix
    // https://github.com/oven-sh/bun/issues/12206
    const fixBunParams = (obj: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
          let val = value.includes('/') ? value.split('/') : value;

          if (Array.isArray(val) && val.length > 1) {
            const sameItems = val.every((v) => v === val[0]);
            if (sameItems) val = val[0];
          }

          return [key, val];
        }),
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
              src: expectedMatch.src,
            }
          : null;

        expect(output).toEqual(expected);
      },
    );

    it.each(DIFFERENT_THAN_BUN_FILESYSTEMROUTER)(
      'should match: %s with some Bun.FileSystemRouter differences',
      (filePath, expected) => {
        const options = {
          dir,
          fileExtensions: ['.tsx', '.js', '.jsx'],
        };
        const router = fileSystemRouter(options);
        const output = router.match(filePath);

        expect(output).toEqual(expected);
      },
    );
  });
});
