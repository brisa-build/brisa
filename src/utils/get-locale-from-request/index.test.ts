import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import getLocaleFromRequest from ".";
import extendRequestContext from "../extend-request-context";

describe("utils", () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      I18N_CONFIG: {
        locales: ["en", "ru"],
        defaultLocale: "en",
      },
      LOCALES_SET: new Set(["en", "ru"]),
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  describe("getLocaleFromRequest", () => {
    it("should return locale from request", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/ru"),
      });
      const locale = getLocaleFromRequest(request);

      expect(locale).toBe("ru");
    });

    it("should return default locale if not locale", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });
      const locale = getLocaleFromRequest(request);

      expect(locale).toBe("en");
    });

    it("should return default locale if locale is not supported", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/ua"),
      });
      const locale = getLocaleFromRequest(request);

      expect(locale).toBe("en");
    });

    it("should return domain default locale if not locale", () => {
      (globalThis.mockConstants as any).I18N_CONFIG.domains = {
        "example.com": {
          defaultLocale: "ru",
        },
      };
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });
      const locale = getLocaleFromRequest(request);

      expect(locale).toBe("ru");
    });

    it("should return domain default locale if locale is not supported", () => {
      (globalThis.mockConstants as any).I18N_CONFIG.domains = {
        "example.com": {
          defaultLocale: "ru",
        },
      };
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/ua"),
      });
      const locale = getLocaleFromRequest(request);

      expect(locale).toBe("ru");
    });

    it("should return the browser language as default locale if locale is not supported", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/ua", {
          headers: {
            "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          },
        }),
      });
      const locale = getLocaleFromRequest(request);

      expect(locale).toBe("ru");
    });

    it("should return the BRISA_LOCALE cookie as default locale if locale is not supported", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/ua"),
      });

      request.headers.set("Cookie", "BRISA_LOCALE=ru");
      request.headers.set(
        "Accept-Language",
        "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
      );

      const locale = getLocaleFromRequest(request);

      expect(locale).toBe("ru");
    });

    it("should return the browser language if the BRISA_LOCALE cookie is not supported locale", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/ua"),
      });

      request.headers.set("Cookie", "BRISA_LOCALE=ua");
      request.headers.set(
        "Accept-Language",
        "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      );

      const locale = getLocaleFromRequest(request);

      expect(locale).toBe("ru");
    });
  });
});
