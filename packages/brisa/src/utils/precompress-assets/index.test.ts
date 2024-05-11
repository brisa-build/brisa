import { describe, it, expect, afterEach } from "bun:test";
import { exists, unlink } from "node:fs/promises";
import path from "node:path";
import precompressAssets from ".";

const assetsPath = path.join(
  import.meta.dir,
  "..",
  "..",
  "__fixtures__",
  "public",
);

describe("utils", () => {
  describe("precompressAssets", () => {
    afterEach(async () =>
      Promise.all([
        unlink(`${assetsPath}/favicon.ico.gz`),
        unlink(`${assetsPath}/some-dir/some-img.png.gz`),
        unlink(`${assetsPath}/favicon.ico.br`),
        unlink(`${assetsPath}/some-dir/some-img.png.br`),
        // some-text.txt.gz is not deleted here because it is used in
        // other tests to check if is seved correctly as text
        // encoding with gzip
      ]),
    );

    it("should precompress all assets", async () => {
      await precompressAssets(assetsPath);

      expect(await exists(`${assetsPath}/favicon.ico.gz`)).toBeTrue();
      expect(await exists(`${assetsPath}/some-dir/some-img.png.gz`)).toBeTrue();
      expect(
        await exists(`${assetsPath}/some-dir/some-text.txt.gz`),
      ).toBeTrue();
      expect(await exists(`${assetsPath}/favicon.ico.br`)).toBeTrue();
      expect(await exists(`${assetsPath}/some-dir/some-img.png.br`)).toBeTrue();
      expect(
        await exists(`${assetsPath}/some-dir/some-text.txt.br`),
      ).toBeTrue();
    });
  });
});
