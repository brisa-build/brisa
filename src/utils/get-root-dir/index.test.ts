import { describe, it, expect } from "bun:test";
import getRootDir from ".";

describe("utils", () => {
  describe("getRootDir", () => {
    it("should return the root directory", () => {
      const input = "some/project/node_modules/bunrise/out/";
      const output = getRootDir(input);
      const expected = "some/project";

      expect(output).toBe(expected);
    });
  });
});
