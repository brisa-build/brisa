import { describe, it, expect } from "bun:test";
import path from "node:path";

import getFilesFromDir from ".";

const assetsPath = path.join(
  import.meta.dir,
  "..",
  "..",
  "__fixtures__",
  "assets",
);

describe("utils", () => {
  describe("getFilesFromDir", () => {
    it("should return all files from a directory", async () => {
      const output = await getFilesFromDir(assetsPath);
      const expected = [
        path.join(assetsPath, 'favicon.ico'),
        path.join(assetsPath, 'some-dir', 'some-img.png'),
        path.join(assetsPath, 'some-dir', 'some-text.txt'),
      ];

      expect(output).toEqual(expected);
    });
  });
});
