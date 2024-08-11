import { FileSystemRouter } from '@/utils/file-system-router';
import { describe, it, expect } from 'bun:test';
import path from 'node:path';

describe('utils', () => {
  describe('FileSystemRouter', () => {
    it('should resolve tsx routes in the "nextjs" style', () => {
      const dir = path.join(import.meta.dirname, '__fixtures__', 'tsx-pages');
      const router = new FileSystemRouter({
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
});
