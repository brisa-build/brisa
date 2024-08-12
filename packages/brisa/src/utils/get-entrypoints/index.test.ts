import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import getEntrypoints from '.';

const pagesDir = path.join(
  import.meta.dir,
  '..',
  '..',
  '__fixtures__',
  'pages',
);
const mdxPagesDir = path.join(
  import.meta.dir,
  '..',
  '..',
  '__fixtures__',
  'mdx-pages',
);

describe('utils', () => {
  describe('getEntrypoints', () => {
    it('should return an array', () => {
      const entrypoints = getEntrypoints(pagesDir);
      const expected = [
        path.sep + 'index.tsx',
        'page-with-web-component.tsx',
        'somepage-with-context.tsx',
        '_500.tsx',
        'somepage.tsx',
        '_404.tsx',
        'foo.tsx',
        'user' + path.sep + '[username].tsx',
      ].map((route) => path.join(pagesDir, route));
      expect(entrypoints).toEqual(expected);
    });

    it('should return an empty array if the directory does not exist', () => {
      const entrypoints = getEntrypoints('some/path');
      expect(Array.isArray(entrypoints)).toBe(true);
      expect(entrypoints.length).toBe(0);
    });

    it("should not return files that end with '.test'", () => {
      const entrypoints = getEntrypoints(pagesDir);
      expect(entrypoints).not.toContain(path.join(pagesDir, 'index.test.tsx'));
    });

    it('should allow mdx files as entrypoints', () => {
      const entrypoints = getEntrypoints(mdxPagesDir);
      const expected = ['index.mdx'].map((route) =>
        path.join(mdxPagesDir, route),
      );
      expect(entrypoints).toEqual(expected);
    });
  });
});
