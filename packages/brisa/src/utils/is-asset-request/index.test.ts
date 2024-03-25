import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import path from "node:path";
import extendRequestContext from "../extend-request-context";
import isAssetRequest from ".";

const ROOT_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const ASSETS_DIR = path.join(ROOT_DIR, "public");

describe("utils", () => {
  describe("is-asset-request", () => {
    beforeAll(() => {
      globalThis.mockConstants = {
        ASSETS_DIR,
      };
    });

    afterAll(() => {
      globalThis.mockConstants = undefined;
    });

    it("should return false if the request is the home", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      expect(isAssetRequest(request)).toBe(false);
    });

    it("should return false if the request is not an asset request", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/foo.bar"),
      });

      expect(isAssetRequest(request)).toBe(false);
    });

    it("should return true if the request is an asset request", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/favicon.ico"),
      });
      expect(isAssetRequest(request)).toBe(true);
    });
  });
});
