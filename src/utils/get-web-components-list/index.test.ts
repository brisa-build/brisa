import path from "node:path";
import { describe, it, expect } from "bun:test";
import getWebComponentsList from ".";

const fixturesDir = path.join(import.meta.dir, "..", "..", "__fixtures__");

describe("utils", () => {
  describe("getWebComponentsList", () => {
    it("should return a list of web components", async () => {
      const result = await getWebComponentsList(fixturesDir);

      expect(result).toEqual({
        "native-some-example": path.join(
          fixturesDir,
          "web-components",
          "@native",
          "some-example.tsx"
        ),
      });
    });

    it.todo(
      "should alert in DEV if there is a web component with the same name, taking one the first one",
      () => {}
    );

    it.todo(
      "should not alert in PROD if there is a web component with the same name, taking one the first one",
      () => {}
    );
  });
});
