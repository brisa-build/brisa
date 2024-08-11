import {
  fileSystemRouter,
  type MatchedBrisaRoute,
} from '@/utils/file-system-router';
import { describe, it, expect } from 'bun:test';
import path from 'node:path';

describe('utils', () => {
  describe('fileSystemRouter > resolve routes', () => {
    it('should resolve tsx routes in the "nextjs" style', () => {
      const dir = path.join(import.meta.dirname, '__fixtures__', 'tsx-pages');
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
  });
  describe('fileSystemRouter > match', () => {
    const BATTERY_TESTS = [
      [
        '/',
        {
          filePath: path.join(
            import.meta.dirname,
            '__fixtures__',
            'tsx-pages',
            'index.tsx',
          ),
          kind: 'exact',
          name: '/',
          pathname: '/',
        },
      ],
      [
        '/about-us',
        {
          filePath: path.join(
            import.meta.dirname,
            '__fixtures__',
            'tsx-pages',
            'about-us.tsx',
          ),
          kind: 'exact',
          name: '/about-us',
          pathname: '/about-us',
        },
      ],
      [
        '/user/john',
        {
          filePath: path.join(
            import.meta.dirname,
            '__fixtures__',
            'tsx-pages',
            'user',
            '[username].tsx',
          ),
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
          filePath: path.join(
            import.meta.dirname,
            '__fixtures__',
            'tsx-pages',
            'foo',
            '[bar]',
            'index.tsx',
          ),
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
          filePath: path.join(
            import.meta.dirname,
            '__fixtures__',
            'tsx-pages',
            'rest',
            '[...s].tsx',
          ),
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
          filePath: path.join(
            import.meta.dirname,
            '__fixtures__',
            'tsx-pages',
            'rest2',
            '[...s]',
            'index.tsx',
          ),
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
          filePath: path.join(
            import.meta.dirname,
            '__fixtures__',
            'tsx-pages',
            'catchall',
            '[[...catchAll]].tsx',
          ),
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
          filePath: path.join(
            import.meta.dirname,
            '__fixtures__',
            'tsx-pages',
            'catchall2',
            '[[...catchAll]]',
            'index.tsx',
          ),
          kind: 'optional-catch-all',
          name: '/catchall2/[[...catchAll]]',
          pathname: '/catchall2/a/b/c',
          params: {
            catchAll: ['a', 'b', 'c'],
          },
        },
      ],
    ] as [string, MatchedBrisaRoute][];
    const dir = path.join(import.meta.dirname, '__fixtures__', 'tsx-pages');

    describe.each(BATTERY_TESTS)('match(%s)', (filePath, expected) => {
      it(`should return ${expected.name}`, () => {
        const router = fileSystemRouter({
          dir,
          fileExtensions: ['.tsx'],
        });

        const result = router.match(filePath);

        expect(result).toEqual(expected as any);
      });
    });
  });
});
