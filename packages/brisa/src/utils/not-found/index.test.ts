import { describe, expect, it } from 'bun:test';
import notFound, { isNotFoundError } from '.';

describe('utils', () => {
  describe('not-found', () => {
    it('should throw an NotFoundError', () => {
      expect(() => notFound()).toThrow('Not found');
    });
  });

  describe('is-not-found-error', () => {
    it('should throw an undefined and not break', () => {
      try {
        throw undefined;
      } catch (err) {
        const result = isNotFoundError(err);
        expect(result).toBe(false);
      }
    });
  });
});
