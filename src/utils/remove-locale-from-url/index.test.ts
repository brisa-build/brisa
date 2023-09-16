import { describe, it, expect } from "bun:test";
import removeLocaleFromUrl from ".";

describe("utils", () => {
  describe("removeLocaleFromUrl", () => {
    it("should remove locale from url", () => {
      const url = removeLocaleFromUrl("https://example.com/ru", "ru");

      expect(url).toBe("https://example.com/");
    });

    it("should remove locale from url with path", () => {
      const url = removeLocaleFromUrl("https://example.com/ru/path", "ru");

      expect(url).toBe("https://example.com/path");
    });

    it("should remove locale from url with query", () => {
      const url = removeLocaleFromUrl("https://example.com/ru?query=1", "ru");

      expect(url).toBe("https://example.com/?query=1");
    });

    it("should remove locale from url with hash", () => {
      const url = removeLocaleFromUrl("https://example.com/ru#hash", "ru");

      expect(url).toBe("https://example.com/#hash");
    });

    it("should not remove locale from url with other locale", () => {
      const url = removeLocaleFromUrl("https://example.com/en", "ru");

      expect(url).toBe("https://example.com/en");
    });
  });
});
