import path from "node:path";
import { describe, it, expect } from "bun:test";
import getWebComponentsList from ".";

const fixturesDir = path.join(import.meta.dir, "..", "..", "__fixtures__");

describe("utils", () => {
  describe("getWebComponentsList", () => {
    it("should return a list of web components", async () => {
      const result = getWebComponentsList(fixturesDir);

      expect(result).toEqual({
        "native-some-example": path.join(
          fixturesDir,
          "web-components",
          "@native",
          "some-example.tsx",
        ),
      });
    });
  });
});
