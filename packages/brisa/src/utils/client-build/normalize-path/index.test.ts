import { describe, expect, it } from 'bun:test';
import { normalizePath } from '.';

describe('build utils -> client build', () => {
  describe('normalizePath', () => {
    it('should return the correct normalized path', () => {
      const rawPathname = '/path/to/page.tsx';
      const expected = '/path/to/page.tsx';
      const result = normalizePath(rawPathname);
      expect(result).toBe(expected);
    });

    it('should return the correct normalized path with custom separator', () => {
      const rawPathname = '/path/to/page.tsx';
      const expected = '/path/to/page.tsx';
      const result = normalizePath(rawPathname, '/');
      expect(result).toBe(expected);
    });

    it('should return the correct normalized path with custom separator', () => {
      const rawPathname = '\\path\\to\\page.tsx';
      const expected = '/path/to/page.tsx';
      const result = normalizePath(rawPathname, '\\');
      expect(result).toBe(expected);
    });
  });
});
