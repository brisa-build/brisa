import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import path from "node:path";
import getRouteMatcher from ".";
import extendRequestContext from "../extend-request-context";

const PAGES_DIR = path.join(
  import.meta.dir,
  "..",
  "..",
  "__fixtures__",
  "pages"
);

describe("utils", () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      PAGES_DIR,
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  describe("getRouteMatcher", () => {
    it("should return a function", () => {
      const { match, reservedRoutes } = getRouteMatcher(PAGES_DIR);
      expect(typeof match).toBe("function");
      expect(reservedRoutes["/_404"]).not.toBeDefined();
    });

    it("should return null if the route is reserved", () => {
      const { match, reservedRoutes } = getRouteMatcher(PAGES_DIR, ["/_404"]);
      const { route, isReservedPathname } = match(
        extendRequestContext({
          originalRequest: new Request("https://example.com/_404"),
        })
      );
      expect(route).not.toBe(null);
      expect(isReservedPathname).toBe(true);
      expect(reservedRoutes["/_404"]).toBeDefined();
    });

    it("should return a route if the route is not reserved", () => {
      const { match, reservedRoutes } = getRouteMatcher(PAGES_DIR, ["/_404"]);
      const { route, isReservedPathname } = match(
        extendRequestContext({
          originalRequest: new Request("https://example.com/somepage"),
        })
      );
      expect(route).not.toBe(null);
      expect(isReservedPathname).toBe(false);
      expect(reservedRoutes["/_404"]).toBeDefined();
    });
  });
});
