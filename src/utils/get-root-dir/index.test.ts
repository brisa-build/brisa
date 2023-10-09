import { describe, it, expect } from "bun:test";
import getRootDir from ".";

describe("utils", () => {
  describe("getRootDir", () => {
    it("should return the src directory", () => {
      const dir = "some/project/node_modules/brisa/out/";
      const output = getRootDir(dir);
      const expected = "some/project";

      expect(output).toBe(expected);
    });
  });
});
