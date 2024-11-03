import { describe, expect, it } from 'bun:test';
import { internalConstants } from '.';

describe('utils -> load-constants', () => {
  describe('internalConstants', () => {
    it('should return IS_SERVE_PROCESS as true and IS_BUILD_PROCESS as false', () => {
      process.argv[1] = 'brisa/out/cli/serve/index.js';
      const result = internalConstants();
      expect(result.IS_SERVE_PROCESS).toBeTrue();
      expect(result.IS_BUILD_PROCESS).toBeFalse();
    });
    it('should return IS_SERVE_PROCESS as false and IS_BUILD_PROCESS as true', () => {
      process.argv[1] = 'brisa/out/cli/build.js';
      const result = internalConstants();
      expect(result.IS_SERVE_PROCESS).toBeFalse();
      expect(result.IS_BUILD_PROCESS).toBeTrue();
    });
    it('should return IS_SERVE_PROCESS as true and IS_BUILD_PROCESS as false (argv Windows format)', () => {
      process.argv[1] = 'brisa\\out\\cli\\serve\\index.js';
      const result = internalConstants();
      expect(result.IS_SERVE_PROCESS).toBeTrue();
      expect(result.IS_BUILD_PROCESS).toBeFalse();
    });
    it('should return IS_SERVE_PROCESS as false and IS_BUILD_PROCESS as true (argv Windows format)', () => {
      process.argv[1] = 'brisa\\out\\cli\\build.js';
      const result = internalConstants();
      expect(result.IS_SERVE_PROCESS).toBeFalse();
      expect(result.IS_BUILD_PROCESS).toBeTrue();
    });

    it('should return BRISA_DIR', () => {
      process.argv[1] = 'brisa/out/cli/serve/index.js';
      const result = internalConstants();
      expect(result.BRISA_DIR).toBe('brisa');
    });

    it('should return BRISA_DIR (argv Windows format)', () => {
      process.argv[1] = 'brisa\\\\out\\\\cli\\\\serve\\\\index.js';
      const result = internalConstants();
      expect(result.BRISA_DIR).toBe('brisa');
    });
  });
});
