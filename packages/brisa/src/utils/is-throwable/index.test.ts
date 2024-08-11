import isThrowable from '@/utils/is-throwable';
import { describe, it, expect } from 'bun:test';

describe('utils', () => {
  describe('isThrowable', () => {
    it('should return true if the error is rerender throwable', () => {
      const error = new Error('rerender');
      error.name = 'rerender';
      expect(isThrowable(error)).toBeTrue();
    });

    it('should return true if the error is navigate throwable', () => {
      const error = new Error('navigate');
      error.name = 'navigate:';
      expect(isThrowable(error)).toBeTrue();
    });

    it('should return true if the error is not found', () => {
      const error = new Error('not found');
      error.name = 'NotFoundError';
      expect(isThrowable(error)).toBeTrue();
    });

    it('should return false if the error is not rerender, navigate or not found', () => {
      const error = new Error('error');
      error.name = 'error';
      expect(isThrowable(error)).toBeFalse();
    });
  });

  describe('isThrowable.rerender', () => {
    it('should return true if the error is rerender throwable', () => {
      const error = new Error('rerender');
      error.name = 'rerender';
      expect(isThrowable.rerender(error)).toBeTrue();
    });

    it('should return true if the error is navigate throwable', () => {
      const error = new Error('navigate');
      error.name = 'navigate:';
      expect(isThrowable.rerender(error)).toBeFalse();
    });

    it('should return true if the error is not found', () => {
      const error = new Error('not found');
      error.name = 'NotFoundError';
      expect(isThrowable.rerender(error)).toBeFalse();
    });

    it('should return false if the error is not rerender, navigate or not found', () => {
      const error = new Error('error');
      error.name = 'error';
      expect(isThrowable.rerender(error)).toBeFalse();
    });
  });

  describe('isThrowable.navigate', () => {
    it('should return true if the error is rerender throwable', () => {
      const error = new Error('rerender');
      error.name = 'rerender';
      expect(isThrowable.navigate(error)).toBeFalse();
    });

    it('should return true if the error is navigate throwable', () => {
      const error = new Error('navigate');
      error.name = 'navigate:';
      expect(isThrowable.navigate(error)).toBeTrue();
    });

    it('should return true if the error is not found', () => {
      const error = new Error('not found');
      error.name = 'NotFoundError';
      expect(isThrowable.navigate(error)).toBeFalse();
    });

    it('should return false if the error is not rerender, navigate or not found', () => {
      const error = new Error('error');
      error.name = 'error';
      expect(isThrowable.navigate(error)).toBeFalse();
    });
  });

  describe('isThrowable.notFound', () => {
    it('should return true if the error is rerender throwable', () => {
      const error = new Error('rerender');
      error.name = 'rerender';
      expect(isThrowable.notFound(error)).toBeFalse();
    });

    it('should return true if the error is navigate throwable', () => {
      const error = new Error('navigate');
      error.name = 'navigate:';
      expect(isThrowable.notFound(error)).toBeFalse();
    });

    it('should return true if the error is not found', () => {
      const error = new Error('not found');
      error.name = 'NotFoundError';
      expect(isThrowable.notFound(error)).toBeTrue();
    });

    it('should return false if the error is not rerender, navigate or not found', () => {
      const error = new Error('error');
      error.name = 'error';
      expect(isThrowable.notFound(error)).toBeFalse();
    });
  });
});
