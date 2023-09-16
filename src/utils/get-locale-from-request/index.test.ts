import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { BunriseRequest } from "../../bunrise";
import getLocaleFromRequest from ".";

describe("utils", () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      I18N_CONFIG: {
        locales: ["en", "ru"],
        defaultLocale: "en",
      },
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  describe("getLocaleFromRequest", () => {
    it("should return locale from request", () => {
      const request = new BunriseRequest(new Request("https://example.com/ru"));
      const locale = getLocaleFromRequest(request);

      expect(locale).toBe("ru");
    });

    it("should return default locale if locale not found", () => {
      const request = new BunriseRequest(new Request("https://example.com/ua"));
      const locale = getLocaleFromRequest(request);

      expect(locale).toBe("en");
    });
  });
});
