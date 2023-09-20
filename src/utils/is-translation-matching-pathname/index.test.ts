import { describe, it, expect } from "bun:test";
import isTranslationMatchingPathname from ".";

describe("isTranslationMatchingPathname", () => {
  it("should match static routes", () => {
    expect(isTranslationMatchingPathname("/foo", "/foo")).toBe(true);
    expect(isTranslationMatchingPathname("/foo", "/bar")).toBe(false);
  });
  it("should match dynamic routes", () => {
    expect(isTranslationMatchingPathname("/[foo]", "/bar")).toBe(true);
    expect(isTranslationMatchingPathname("/[foo]", "/bar/baz")).toBe(false);
  });
  it("should match dynamic routes with numbers", () => {
    expect(isTranslationMatchingPathname("/[foo]", "/23")).toBe(true);
    expect(isTranslationMatchingPathname("/[foo]", "/323/1234")).toBe(false);
  });
  it("should match dynamic routes with special characters", () => {
    expect(isTranslationMatchingPathname("/[foo]", "/bar-fa")).toBe(true);
    expect(isTranslationMatchingPathname("/[foo]", "/bar-fa/baz-some")).toBe(
      false,
    );
  });
  it("should match nested dynamic routes", () => {
    expect(
      isTranslationMatchingPathname("/foo/[bar]/[bla]", "/foo/some/page"),
    ).toBe(true);
    expect(isTranslationMatchingPathname("/foo/[bar]/[bla]", "/foo")).toBe(
      false,
    );
  });
  it("should match rest dynamic routes", () => {
    expect(
      isTranslationMatchingPathname("/foo/[...bar]", "/foo/some/page"),
    ).toBe(true);
    expect(isTranslationMatchingPathname("/foo/[...bar]", "/foo")).toBe(false);
  });
  it("should match nested rest dynamic routes", () => {
    expect(
      isTranslationMatchingPathname(
        "/foo/[bar]/[...bla]",
        "/foo/some/page/with/more",
      ),
    ).toBe(true);
    expect(isTranslationMatchingPathname("/foo/[bar]/[...bla]", "/foo")).toBe(
      false,
    );
  });
  it("should match catch all dynamic routes", () => {
    expect(
      isTranslationMatchingPathname("/foo/[[...bar]]", "/foo/some/page"),
    ).toBe(true);
    expect(isTranslationMatchingPathname("/foo/[[...bar]]", "/foo")).toBe(
      false,
    );
  });
  it("should match nested catch all with dynamic routes", () => {
    expect(
      isTranslationMatchingPathname(
        "/foo/[bar]/[[...bla]]",
        "/foo/some/page/with/more",
      ),
    ).toBe(true);
    expect(isTranslationMatchingPathname("/foo/[bar]/[[...bla]]", "/foo")).toBe(
      false,
    );
  });
});
