import { describe, it, expect, afterEach, beforeEach } from 'bun:test';
import { exists, unlink } from 'node:fs/promises';
import path from 'node:path';
import { getConstants } from '@/constants';
import precompressAssets from '.';

const assetsPath = path.join(import.meta.dir, '..', '..', '__fixtures__', 'public');

describe('utils', () => {
  describe('precompressAssets', () => {
    beforeEach(() => {
      globalThis.mockConstants = {
        ...getConstants(),
        IS_PRODUCTION: true,
        CONFIG: {
          assetCompression: true,
        },
      };
    });
    afterEach(async () => {
      globalThis.mockConstants = undefined;
      if (await exists(`${assetsPath}/favicon.ico.gz`)) {
        await Promise.all([
          unlink(`${assetsPath}/favicon.ico.gz`),
          unlink(`${assetsPath}/some-dir/some-img.png.gz`),
          unlink(`${assetsPath}/favicon.ico.br`),
          unlink(`${assetsPath}/some-dir/some-img.png.br`),
          // some-text.txt.gz and some-text.txt.br are not deleted
          // to use them in other tests suites.
        ]);
      }
    });

    it('should precompress all assets', async () => {
      await precompressAssets(assetsPath);

      expect(await exists(`${assetsPath}/favicon.ico.gz`)).toBeTrue();
      expect(await exists(`${assetsPath}/some-dir/some-img.png.gz`)).toBeTrue();
      expect(await exists(`${assetsPath}/some-dir/some-text.txt.gz`)).toBeTrue();
      expect(await exists(`${assetsPath}/favicon.ico.br`)).toBeTrue();
      expect(await exists(`${assetsPath}/some-dir/some-img.png.br`)).toBeTrue();
      expect(await exists(`${assetsPath}/some-dir/some-text.txt.br`)).toBeTrue();
    });

    it('should not precomopress any file in development', async () => {
      globalThis.mockConstants!.IS_PRODUCTION = false;
      const res = await precompressAssets(assetsPath);

      expect(res).toBeNull();
    });

    it('should not precomopress any file if assetCompression is false', async () => {
      globalThis.mockConstants!.CONFIG!.assetCompression = false;
      const res = await precompressAssets(assetsPath);

      expect(res).toBeNull();
    });
  });
});
