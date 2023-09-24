import { describe, it, expect } from "bun:test";
import getRootDir from ".";

describe("utils", () => {
  describe("getRootDir", () => {
    it("should return the src directory in development", () => {
      const dir = "some/project/node_modules/brisa/out/";
      const env = "development";
      const output = getRootDir(env, dir);
      const expected = "some/project/src";

      expect(output).toBe(expected);
    });

    it("should return the build directory in production", () => {
      const dir = "some/project/node_modules/brisa/out/";
      const env = "production";
      const output = getRootDir(env, dir);
      const expected = "some/project/build";

      expect(output).toBe(expected);
    });
  });
});
