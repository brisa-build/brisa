import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { getConstants } from "@/constants";
import {
  addBasePathToStringURL,
  removeBasePathFromStringURL,
} from "@/utils/base-path";

describe("utils", () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      CONFIG: {
        basePath: "/base-path",
      },
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  describe("base-path", () => {
    describe("addBasePathToStringURL", () => {
      it("should add base path to the URL", () => {
        const input = "/test";
        const output = addBasePathToStringURL(input);
        const expected = "/base-path/test";

        expect(output).toBe(expected);
      });

      it("should duplicate the base path if it is already in the URL", () => {
        const input = "/base-path/test";
        const output = addBasePathToStringURL(input);
        const expected = "/base-path/base-path/test";

        expect(output).toBe(expected);
      });

      it("should not add base path to the URL if it is not provided", () => {
        globalThis.mockConstants = {
          ...globalThis.mockConstants,
          CONFIG: {},
        };
        const input = "/test";
        const output = addBasePathToStringURL(input);
        const expected = "/test";

        expect(output).toBe(expected);
      });

      it("should add base path to the URL with trailing slash", () => {
        const input = "/test/";
        const output = addBasePathToStringURL(input);
        const expected = "/base-path/test/";

        expect(output).toBe(expected);
      });

      it("should work with full URL", () => {
        const input = "http://localhost/test";
        const output = addBasePathToStringURL(input);
        const expected = "http://localhost/base-path/test";

        expect(output).toBe(expected);
      });

      it("should work with full URL with trailing slash", () => {
        const input = "http://localhost/test/";
        const output = addBasePathToStringURL(input);
        const expected = "http://localhost/base-path/test/";

        expect(output).toBe(expected);
      });
    });

    describe("removeBasePathFromStringURL", () => {
      it("should remove base path from the URL", () => {
        const input = "/base-path/test";
        const output = removeBasePathFromStringURL(input);
        const expected = "/test";

        expect(output).toBe(expected);
      });

      it("should not remove base path from the URL if it is not provided", () => {
        globalThis.mockConstants = {
          ...globalThis.mockConstants,
          CONFIG: {},
        };
        const input = "/base-path/test";
        const output = removeBasePathFromStringURL(input);
        const expected = "/base-path/test";

        expect(output).toBe(expected);
      });

      it("should remove base path from the URL with trailing slash", () => {
        const input = "/base-path/test/";
        const output = removeBasePathFromStringURL(input);
        const expected = "/test/";

        expect(output).toBe(expected);
      });

      it("should work with full URL", () => {
        const input = "http://localhost/base-path/test";
        const output = removeBasePathFromStringURL(input);
        const expected = "http://localhost/test";

        expect(output).toBe(expected);
      });

      it("should work with full URL with trailing slash", () => {
        const input = "http://localhost/base-path/test/";
        const output = removeBasePathFromStringURL(input);
        const expected = "http://localhost/test/";

        expect(output).toBe(expected);
      });

      it("should remove only the first occurrence of the base path", () => {
        const input = "/base-path/base-path/test";
        const output = removeBasePathFromStringURL(input);
        const expected = "/base-path/test";

        expect(output).toBe(expected);
      });
    });
  });
});
