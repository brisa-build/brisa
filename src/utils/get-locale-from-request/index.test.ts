import { describe, it, expect } from "bun:test";
import { BunriseRequest } from "../../bunrise";
import getLocaleFromRequest from ".";

describe("utils", () => {
  describe("getLocaleFromRequest", () => {
    it("should return locale from request", () => {
      const i18n = {
        defaultLocale: "en",
        locales: ["en", "ru"],
      };
      const request = new BunriseRequest(new Request("https://example.com/ru"));
      const locale = getLocaleFromRequest(i18n, request);

      expect(locale).toBe("ru");
    });

    it("should return default locale if locale not found", () => {
      const i18n = {
        defaultLocale: "en",
        locales: ["en", "ru"],
      };
      const request = new BunriseRequest(new Request("https://example.com/ua"));
      const locale = getLocaleFromRequest(i18n, request);

      expect(locale).toBe("en");
    });
  });
});
