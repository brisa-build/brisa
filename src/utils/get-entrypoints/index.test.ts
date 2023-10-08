import { describe, it, expect } from "bun:test";
import path from "node:path";
import getEntrypoints from ".";

const pagesDir = path.join(
  import.meta.dir,
  "..",
  "..",
  "__fixtures__",
  "pages",
);

describe("utils", () => {
  describe("getEntrypoints", () => {
    it("should return an array", () => {
      const entrypoints = getEntrypoints(pagesDir);
      const expected = [
        "_404.tsx",
        "page-with-web-component.tsx",
        "somepage.tsx",
        "/index.tsx",
        "user/[username].tsx",
      ].map((route) => path.join(pagesDir, route));
      expect(entrypoints).toEqual(expected);
    });

    it("should return an empty array if the directory does not exist", () => {
      const entrypoints = getEntrypoints("some/path");
      expect(Array.isArray(entrypoints)).toBe(true);
      expect(entrypoints.length).toBe(0);
    });
  });
});
