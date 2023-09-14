import { describe, it, expect } from "bun:test";
import detectSrcFile from ".";

const dir = `${import.meta.dir}/../__fixtures__/files-to-detect`;

describe("utils", () => {
  describe("detectSrcFile", () => {
    it("should detect tsx-file.tsx", async () => {
      const input = "tsx-file";
      const output = await detectSrcFile(input, dir);
      const expected = true;

      expect(output).toEqual(expected);
    });

    it("should detect ts-file.ts", async () => {
      const input = "ts-file";
      const output = await detectSrcFile(input, dir);
      const expected = true;

      expect(output).toEqual(expected);
    });

    it("should detect js-file.js", async () => {
      const input = "js-file";
      const output = await detectSrcFile(input, dir);
      const expected = true;

      expect(output).toEqual(expected);
    });

    it("should detect tsx-folder-file.tsx", async () => {
      const input = "tsx-folder-file";
      const output = await detectSrcFile(input, dir);
      const expected = true;

      expect(output).toEqual(expected);
    });

    it("should detect ts-folder-file.ts", async () => {
      const input = "ts-folder-file";
      const output = await detectSrcFile(input, dir);
      const expected = true;

      expect(output).toEqual(expected);
    });

    it("should detect js-folder-file.js", async () => {
      const input = "js-folder-file";
      const output = await detectSrcFile(input, dir);
      const expected = true;

      expect(output).toEqual(expected);
    });
  });
});
