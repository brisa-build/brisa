import { describe, expect, it, spyOn, afterEach, mock } from 'bun:test';
import path from 'node:path';
import { internalConstants, loadProjectConstants } from '.';

let mockPathJoin: ReturnType<typeof spyOn>;

const mockPackageJson = {
  devDependencies: {
    typescript: 'latest',
    'bun-types': 'latest',
  },
};

mock.module('package.json', () => mockPackageJson);

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

  describe('loadProjectConstants', () => {
    it('should lightningcss as CONFIG.external', async () => {
      process.env.npm_package_json = undefined;
      const result = await loadProjectConstants({
        IS_PRODUCTION: false,
        BUILD_DIR: 'build',
        WORKSPACE: 'workspace',
        ROOT_DIR: 'root',
      } as any);
      expect(result.CONFIG.external).toEqual(['lightningcss']);
    });

    it('should return the devDependencies keys with lightningcss if the package.json file exists at the specified path', async () => {
      process.env.npm_package_json = 'package.json';
      const result = await loadProjectConstants({
        IS_PRODUCTION: true,
        BUILD_DIR: 'build',
        WORKSPACE: 'workspace',
        ROOT_DIR: 'root',
      } as any);
      expect(result.CONFIG.external).toEqual([
        ...Object.keys(mockPackageJson.devDependencies),
        'lightningcss',
      ]);
    });
  });
});
