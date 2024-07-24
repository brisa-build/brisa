import { describe, expect, it } from 'bun:test';
import generateUniqueVariableName from '.';

describe('utils', () => {
  describe('client-build-plugin', () => {
    describe('generateUniqueVariableName', () => {
      it('should return a unique variable names', () => {
        expect(generateUniqueVariableName('d', new Set(['a', 'b', 'c']))).toBe('d');
        expect(generateUniqueVariableName('b', new Set(['a', 'b', 'c']))).toBe('b$');
        expect(generateUniqueVariableName('a', new Set(['a', 'a$', 'a$$']))).toBe('a$$$');
      });
    });
  });
});
