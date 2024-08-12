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
      '/admin',
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
      '/admin/',
      '/admin/1/',
      '/admin/1/providers/',
      '/admin/1/providers/2/delete/',
      '/admin/1/providers/2/edit/',
      '/admin/1/providers/create/',

      // With query:
      '/?test=1',
      '/user/john?test=1',
      '/foo/bar?test=1',
      '/rest/a/b/c?test=1',
      '/rest2/a/b/c?test=1',
      '/catchall/a/b/c?test=1',
      '/catchall/a/b/cc/dd/eee?test=1',
      '/catchall2/a/b/c?test=1',
      '/nested/john/foo/bar/baz/quux?test=1',
      '/nested2/john/foo/bar/baz/quux?test=1',
      '/admin/?test=1',
      '/admin/1?test=1',
      '/admin/1/providers?test=1',
      '/admin/1/providers/2/delete?test=1',
      '/admin/1/providers/2/edit?test=1',
      '/admin/1/providers/create?test=1',

      // With query with slashes:
      '/?test=1/2/3',
      '/user/john?test=1/2/3',
      '/foo/bar?test=1/2/3',
      '/rest/a/b/c?test=1/2/3',
      '/rest2/a/b/c?test=1/2/3',
      '/catchall/a/b/c?test=1/2/3',
      '/catchall/a/b/cc/dd/eee?test=1/2/3',
      '/catchall2/a/b/c?test=1/2/3',
      '/nested/john/foo/bar/baz/quux?test=1/2/3',
      '/nested2/john/foo/bar/baz/quux?test=1/2/3',
      '/admin/?test=1/2/3',
      '/admin/1?test=1/2/3',
      '/admin/1/providers?test=1/2/3',
      '/admin/1/providers/2/delete?test=1/2/3',
      '/admin/1/providers/2/edit?test=1/2/3',
      '/admin/1/providers/create?test=1/2/3',

      // With query and trailing slash:
      '/user/john/?test=1',
      '/foo/bar/?test=1',
      '/rest/a/b/c/?test=1',
      '/rest2/a/b/c/?test=1',
      '/catchall/a/b/c/?test=1',
      '/catchall/a/b/cc/dd/eee/?test=1',
      '/catchall2/a/b/c/?test=1',
      '/nested/john/foo/bar/baz/quux/?test=1',
      '/nested2/john/foo/bar/baz/quux/?test=1',
      '/admin/?test=1',
      '/admin/1/?test=1',
      '/admin/1/providers/?test=1',
      '/admin/1/providers/2/delete/?test=1',
      '/admin/1/providers/2/edit/?test=1',
      '/admin/1/providers/create/?test=1',

      // With query and hash:
      '/?test=1#hash',
      '/user/john?test=1#hash',
      '/foo/bar?test=1#hash',
      '/rest/a/b/c?test=1#hash',
      '/rest2/a/b/c?test=1#hash',
      '/catchall/a/b/c?test=1#hash',
      '/catchall/a/b/cc/dd/eee?test=1#hash',
      '/catchall2/a/b/c?test=1#hash',
      '/nested/john/foo/bar/baz/quux?test=1#hash',
      '/nested2/john/foo/bar/baz/quux?test=1#hash',
      '/admin/?test=1#hash',
      '/admin/1?test=1#hash',
      '/admin/1/providers?test=1#hash',
      '/admin/1/providers/2/delete?test=1#hash',
      '/admin/1/providers/2/edit?test=1#hash',
      '/admin/1/providers/create?test=1#hash',

      // With query, hash and trailing slash:
      '/user/john/?test=1#hash',
      '/foo/bar/?test=1#hash',
      '/rest/a/b/c/?test=1#hash',
      '/rest2/a/b/c/?test=1#hash',
      '/catchall/a/b/c/?test=1#hash',
      '/catchall/a/b/cc/dd/eee/?test=1#hash',
      '/catchall2/a/b/c/?test=1#hash',
      '/nested/john/foo/bar/baz/quux/?test=1#hash',
      '/nested2/john/foo/bar/baz/quux/?test=1#hash',
      '/admin/1/?test=1#hash',
      '/admin/1/providers/?test=1#hash',
      '/admin/1/providers/2/delete/?test=1#hash',
      '/admin/1/providers/2/edit/?test=1#hash',
      '/admin/1/providers/create/?test=1#hash',

      // With double slash:
      '//',
      '//user/john',
      '//foo/bar',
    ];

    const SHOULD_RETURN_NULL = ['/admin/1/b/c/d/e', '/user/john/a/b/c'];

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
    function fixBunParams(obj: Record<string, string>, filePath: string) {
      const url = new URL(filePath.replace(/\/+/g, '/'), 'http://localhost');
      const test = url.searchParams.get('test');

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
          if (value.includes('#')) value = value.split('#')[0];
          let val =
            value.includes('/') && value !== test ? value.split('/') : value;

          if (Array.isArray(val) && val.length > 1) {
            const sameItems = val.every((v) => v === val[0]);
            if (sameItems) val = val[0];
          }

          return [key, val];
        }),
      );
    }

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
              pathname: expectedMatch.pathname.replace(/\/+/g, '/'),
              params: fixBunParams(expectedMatch.params, filePath),
              query: fixBunParams(expectedMatch.query, filePath),
              src: expectedMatch.src,
            }
          : null;

        expect(output).toEqual(expected);
      },
    );

    it.each(SHOULD_RETURN_NULL)('should return null for: %s', (filePath) => {
      const options = {
        dir,
        fileExtensions: ['.tsx', '.js', '.jsx'],
      };
      const router = fileSystemRouter(options);
      const output = router.match(filePath);

      expect(output).toBeNull();
    });

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
