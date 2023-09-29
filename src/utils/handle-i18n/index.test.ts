import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import path from "node:path";
import handleI18n from ".";
import { RequestContext } from "../../core";

const rootDir = path.join(import.meta.dir, "..", "..", "__fixtures__");
const pagesDir = path.join(rootDir, "pages");

describe("handleI18n util", () => {
  describe("without trailing slash", () => {
    beforeEach(() => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: false,
        },
        I18N_CONFIG: {
          locales: ["en", "ru"],
          defaultLocale: "en",
        },
        LOCALES_SET: new Set(["en", "ru"]),
        ROOT_DIR: rootDir,
        PAGES_DIR: pagesDir,
        RESERVED_PAGES: ["/_404", "/_500"],
      };
    });

    afterEach(() => {
      globalThis.mockConstants = undefined;
    });

    it("should not do anything if there is no i18n config", () => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: false,
        },
      };
      const req = new Request("https://example.com");
      const { response, pagesRouter, rootRouter } = handleI18n(
        new RequestContext(req),
      );

      expect(response).toBeUndefined();
      expect(pagesRouter).not.toBeDefined();
      expect(rootRouter).not.toBeDefined();
    });

    it("should redirect to default locale if there is no locale in the URL", () => {
      const req = new RequestContext(new Request("https://example.com"));
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/en");
    });

    it("should redirect to the browser language as default locale if there is no locale in the URL", () => {
      const req = new RequestContext(
        new Request("https://example.com", {
          headers: {
            "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          },
        }),
      );
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/ru");
    });

    it("should redirect to the last browser language as default locale if there is no locale in the URL", () => {
      const req = new RequestContext(
        new Request("https://example.com", {
          headers: {
            "Accept-Language":
              "es-ES,es;q=0.9,de-CH;q=0.7,de;q=0.6,pt;q=0.5,ru-RU;q=0.4",
          },
        }),
      );
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/ru");
    });

    it("should redirect with pathname and query params if there is no locale in the URL", () => {
      const req = new RequestContext(
        new Request("https://example.com/somepage?foo=bar"),
      );
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/en/somepage?foo=bar");
    });

    it("should not redirect if there is locale in the URL", () => {
      const req = new RequestContext(new Request("https://example.com/en/"));
      const { response, pagesRouter, rootRouter } = handleI18n(req);
      expect(response).toBeUndefined();
      expect(pagesRouter).toBeDefined();
      expect(rootRouter).toBeDefined();
    });

    it("should not redirect if there is locale in the URL without trailings slash", () => {
      const req = new RequestContext(new Request("https://example.com/en"));
      const { response, pagesRouter, rootRouter } = handleI18n(req);
      expect(response).toBeUndefined();
      expect(pagesRouter).toBeDefined();
      expect(rootRouter).toBeDefined();
    });

    it("should not redirect if there is locale in the URL with pathname and query params", () => {
      const req = new RequestContext(
        new Request("https://example.com/en/somepage?foo=bar"),
      );
      const { response, pagesRouter, rootRouter } = handleI18n(req);
      expect(response).toBeUndefined();
      expect(pagesRouter).toBeDefined();
      expect(rootRouter).toBeDefined();
    });

    it("should pageRouter that handleI18n returns works with locale", () => {
      const req = new RequestContext(
        new Request("https://example.com/en/somepage?foo=bar"),
      );
      const { pagesRouter } = handleI18n(req);
      const { route: pagesRoute } = pagesRouter?.match(req) || {};

      expect(pagesRoute).toBeDefined();
      expect(pagesRoute?.filePath).toBe(path.join(pagesDir, "somepage.tsx"));
    });
  });
  describe("with trailing slash", () => {
    beforeEach(() => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: true,
        },
        I18N_CONFIG: {
          locales: ["en", "ru"],
          defaultLocale: "en",
        },
        LOCALES_SET: new Set(["en", "ru"]),
        ROOT_DIR: rootDir,
        PAGES_DIR: pagesDir,
        RESERVED_PAGES: ["/_404", "/_500"],
      };
    });

    afterEach(() => {
      globalThis.mockConstants = undefined;
    });

    it("should not do anything if there is no i18n config", () => {
      globalThis.mockConstants = {
        CONFIG: {
          trailingSlash: true,
        },
      };
      const req = new Request("https://example.com");
      const { response, pagesRouter, rootRouter } = handleI18n(
        new RequestContext(req),
      );

      expect(response).toBeUndefined();
      expect(pagesRouter).not.toBeDefined();
      expect(rootRouter).not.toBeDefined();
    });

    it("should redirect to default locale if there is no locale in the URL", () => {
      const req = new RequestContext(new Request("https://example.com"));
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/en/");
    });

    it("should redirect to the browser language as default locale if there is no locale in the URL", () => {
      const req = new RequestContext(
        new Request("https://example.com", {
          headers: {
            "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          },
        }),
      );
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/ru/");
    });

    it("should redirect to the last browser language as default locale if there is no locale in the URL", () => {
      const req = new RequestContext(
        new Request("https://example.com", {
          headers: {
            "Accept-Language":
              "es-ES,es;q=0.9,de-CH;q=0.7,de;q=0.6,pt;q=0.5,ru-RU;q=0.4",
          },
        }),
      );
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/ru/");
    });
  });
});
