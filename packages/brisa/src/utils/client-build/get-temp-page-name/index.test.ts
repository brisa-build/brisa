import { describe, expect, it } from 'bun:test';
import { getConstants } from '@/constants';
import { join } from 'node:path';
import { getTempPageName } from '.';

describe('build utils -> client build', () => {
  describe('getTempPageName', () => {
    it('should return the correct temp file name', () => {
      const { BUILD_DIR } = getConstants();
      const pagePath = '/path/to/page.tsx';
      const expected = join(BUILD_DIR, '_brisa', 'temppage_tsx.ts');
      const result = getTempPageName(pagePath);
      expect(result).toBe(expected);
    });

    it('should not conflict between similar page paths', () => {
      const { BUILD_DIR } = getConstants();
      const pagePath1 = '/path/to/page-example.tsx';
      const pagePath2 = '/path/to/page/example.tsx';

      const expected1 = join(
        BUILD_DIR,
        '_brisa',
        'temppage_example_tsx.ts',
      );
      const expected2 = join(
        BUILD_DIR,
        '_brisa',
        'tempexample_tsx.ts',
      );

      const result1 = getTempPageName(pagePath1);
      const result2 = getTempPageName(pagePath2);

      expect(result1).toBe(expected1);
      expect(result2).toBe(expected2);
    });

    it('should handle page paths with multiple extensions correctly', () => {
      const { BUILD_DIR } = getConstants();
      const pagePath = '/path/to/page.min.tsx';
      const expected = join(BUILD_DIR, '_brisa', 'temppage_min_tsx.ts');
      const result = getTempPageName(pagePath);
      expect(result).toBe(expected);
    });
  });
});
