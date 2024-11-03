import { describe, expect, it, spyOn, afterEach } from 'bun:test';
import path from 'node:path';
import { internalConstants } from '.';

let mockPathJoin: ReturnType<typeof spyOn>;

describe('utils -> load-constants', () => {
  afterEach(() => {
    mockPathJoin?.mockRestore();
  });
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
      mockPathJoin = spyOn(path, 'join').mockImplementation((...args) =>
        path.win32.join(...args),
      );
      process.argv[1] = 'brisa\\out\\cli\\serve\\index.js';
      const result = internalConstants();
      expect(result.IS_SERVE_PROCESS).toBeTrue();
      expect(result.IS_BUILD_PROCESS).toBeFalse();
    });
    it('should return IS_SERVE_PROCESS as false and IS_BUILD_PROCESS as true (argv Windows format)', () => {
      mockPathJoin = spyOn(path, 'join').mockImplementation((...args) =>
        path.win32.join(...args),
      );
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
      mockPathJoin = spyOn(path, 'join').mockImplementation((...args) =>
        path.win32.join(...args),
      );
      process.argv[1] = 'brisa\\out\\cli\\serve\\index.js';
      const result = internalConstants();
      expect(result.BRISA_DIR).toBe('brisa');
    });
  });
});
