import { describe, expect, it } from 'bun:test';
import { getConstants } from '@/constants';
import { join } from 'node:path';
import { getTempPageName } from '.';

describe('build utils -> client build', () => {
  describe('getTempPageName', () => {
    it('should return the correct temp file name', () => {
      const { BUILD_DIR } = getConstants();
      const pagePath = '/path/to/page.tsx';
      const expected = join(BUILD_DIR, '_brisa', 'temp-path-to-page.ts');
      const result = getTempPageName(pagePath);
      expect(result).toBe(expected);
    });
  });
});
