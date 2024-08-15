import { wyhash } from '@/utils/wyhash';
import { describe, it, expect } from 'bun:test';

describe('utils', () => {
  describe('wyhash === Bun.hash', () => {
    it('should return the same hash', () => {
      const input = 'Hello, world!';
      const seed = 0;

      const result = wyhash(input, seed);
      const expected = Bun.hash(input, seed);

      expect(result).toBe(expected);
    });

    it('should return the same hash with a different seed', () => {
      const input = 'Hello, world!';
      const seed = 1;

      const result = wyhash(input, seed);
      const expected = Bun.hash(input, seed);

      expect(result).toBe(expected);
    });
  });
});
