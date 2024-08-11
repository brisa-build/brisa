import throwable from '@/utils/is-throwable';
import { describe, it, expect } from 'bun:test';

describe('utils', () => {
  describe('throwable.is', () => {
    it('should return true if the error is rerender throwable', () => {
      const error = new Error('rerender');
      error.name = 'rerender';
      expect(throwable.is(error)).toBeTrue();
    });

    it('should return true if the error is navigate throwable', () => {
      const error = new Error('navigate');
      error.name = 'navigate:';
      expect(throwable.is(error)).toBeTrue();
    });

    it('should return true if the error is not found', () => {
      const error = new Error('not found');
      error.name = 'NotFoundError';
      expect(throwable.is(error)).toBeTrue();
    });

    it('should return false if the error is not rerender, navigate or not found', () => {
      const error = new Error('error');
      error.name = 'error';
      expect(throwable.is(error)).toBeFalse();
    });
  });

  describe('throwable.isRerender', () => {
    it('should return true if the error is rerender throwable', () => {
      const error = new Error('rerender');
      error.name = 'rerender';
      expect(throwable.isRerender(error)).toBeTrue();
    });

    it('should return true if the error is navigate throwable', () => {
      const error = new Error('navigate');
      error.name = 'navigate:';
      expect(throwable.isRerender(error)).toBeFalse();
    });

    it('should return true if the error is not found', () => {
      const error = new Error('not found');
      error.name = 'NotFoundError';
      expect(throwable.isRerender(error)).toBeFalse();
    });

    it('should return false if the error is not rerender, navigate or not found', () => {
      const error = new Error('error');
      error.name = 'error';
      expect(throwable.isRerender(error)).toBeFalse();
    });
  });

  describe('throwable.isNavigate', () => {
    it('should return true if the error is rerender throwable', () => {
      const error = new Error('rerender');
      error.name = 'rerender';
      expect(throwable.isNavigate(error)).toBeFalse();
    });

    it('should return true if the error is navigate throwable', () => {
      const error = new Error('navigate');
      error.name = 'navigate:';
      expect(throwable.isNavigate(error)).toBeTrue();
    });

    it('should return true if the error is not found', () => {
      const error = new Error('not found');
      error.name = 'NotFoundError';
      expect(throwable.isNavigate(error)).toBeFalse();
    });

    it('should return false if the error is not rerender, navigate or not found', () => {
      const error = new Error('error');
      error.name = 'error';
      expect(throwable.isNavigate(error)).toBeFalse();
    });
  });

  describe('throwable.isNotFound', () => {
    it('should return true if the error is rerender throwable', () => {
      const error = new Error('rerender');
      error.name = 'rerender';
      expect(throwable.isNotFound(error)).toBeFalse();
    });

    it('should return true if the error is navigate throwable', () => {
      const error = new Error('navigate');
      error.name = 'navigate:';
      expect(throwable.isNotFound(error)).toBeFalse();
    });

    it('should return true if the error is not found', () => {
      const error = new Error('not found');
      error.name = 'NotFoundError';
      expect(throwable.isNotFound(error)).toBeTrue();
    });

    it('should return false if the error is not rerender, navigate or not found', () => {
      const error = new Error('error');
      error.name = 'error';
      expect(throwable.isNotFound(error)).toBeFalse();
    });
  });
});
