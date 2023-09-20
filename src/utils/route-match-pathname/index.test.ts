import { describe, it, expect } from "bun:test";
import routeMatchPathname from ".";

describe('utils', () => {
  describe("routeMatchPathname", () => {
    it("should match static routes", () => {
      expect(routeMatchPathname("/foo", "/foo")).toBe(true);
      expect(routeMatchPathname("/foo", "/bar")).toBe(false);
    });
    it("should match dynamic routes", () => {
      expect(routeMatchPathname("/[foo]", "/bar")).toBe(true);
      expect(routeMatchPathname("/[foo]", "/bar/baz")).toBe(false);
    });
    it("should match dynamic routes with numbers", () => {
      expect(routeMatchPathname("/[foo]", "/23")).toBe(true);
      expect(routeMatchPathname("/[foo]", "/323/1234")).toBe(false);
    });
    it("should match dynamic routes with special characters", () => {
      expect(routeMatchPathname("/[foo]", "/bar-fa")).toBe(true);
      expect(routeMatchPathname("/[foo]", "/bar-fa/baz-some")).toBe(
        false,
      );
    });
    it("should match nested dynamic routes", () => {
      expect(
        routeMatchPathname("/foo/[bar]/[bla]", "/foo/some/page"),
      ).toBe(true);
      expect(routeMatchPathname("/foo/[bar]/[bla]", "/foo")).toBe(
        false,
      );
    });
    it("should match rest dynamic routes", () => {
      expect(
        routeMatchPathname("/foo/[...bar]", "/foo/some/page"),
      ).toBe(true);
      expect(routeMatchPathname("/foo/[...bar]", "/foo")).toBe(false);
    });
    it("should match nested rest dynamic routes", () => {
      expect(
        routeMatchPathname(
          "/foo/[bar]/[...bla]",
          "/foo/some/page/with/more",
        ),
      ).toBe(true);
      expect(routeMatchPathname("/foo/[bar]/[...bla]", "/foo")).toBe(
        false,
      );
    });
    it("should match catch all dynamic routes", () => {
      expect(
        routeMatchPathname("/foo/[[...bar]]", "/foo/some/page"),
      ).toBe(true);
      expect(routeMatchPathname("/foo/[[...bar]]", "/foo")).toBe(
        false,
      );
    });
    it("should match nested catch all with dynamic routes", () => {
      expect(
        routeMatchPathname(
          "/foo/[bar]/[[...bla]]",
          "/foo/some/page/with/more",
        ),
      ).toBe(true);
      expect(routeMatchPathname("/foo/[bar]/[[...bla]]", "/foo")).toBe(
        false,
      );
    });
  });
})
