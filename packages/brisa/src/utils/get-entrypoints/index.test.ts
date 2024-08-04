import { describe, it, expect, spyOn } from 'bun:test';
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
        '_404.tsx',
        '_500.tsx',
        'foo.tsx',
        'page-with-web-component.tsx',
        'somepage.tsx',
        'somepage-with-context.tsx',
        path.sep + 'index.tsx',
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

    it('should return the routes with the correct path separator', () => {
      const separator = '\\';
      const entrypoints = getEntrypoints(pagesDir, separator);

      const expected = [
        '_404.tsx',
        '_500.tsx',
        'foo.tsx',
        'page-with-web-component.tsx',
        'somepage.tsx',
        'somepage-with-context.tsx',
        'index.tsx',
        'user\\[username].tsx',
      ].map((route) => pagesDir.replaceAll('/', '\\') + '\\' + route);

      expect(entrypoints).toEqual(expected);

      const otherSeparator = '/';
      const otherEntrypoints = getEntrypoints(pagesDir, otherSeparator);

      expect(otherEntrypoints).toEqual(
        expected.map((route) => route.replace(/\\/g, '/')),
      );
    });
  });
});
