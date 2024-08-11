import { describe, expect, it } from 'bun:test';
import notFound, { isNotFoundError } from '.';

describe('utils', () => {
  describe('not-found', () => {
    it('should throw an NotFoundError', () => {
      expect(() => notFound()).toThrow('Not found');
    });
  });
});
