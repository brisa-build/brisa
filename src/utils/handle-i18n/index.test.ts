import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import path from "node:path";
import handleI18n from ".";
import extendRequestContext from "../extend-request-context";

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
        extendRequestContext({ originalRequest: req }),
      );

      expect(response).toBeUndefined();
      expect(pagesRouter).not.toBeDefined();
      expect(rootRouter).not.toBeDefined();
    });

    it("should redirect to default locale if there is no locale in the URL", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/en");
    });

    it("should redirect to the browser language as default locale if there is no locale in the URL", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com", {
          headers: {
            "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          },
        }),
      });
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/ru");
    });

    it("should redirect to the last browser language as default locale if there is no locale in the URL", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com", {
          headers: {
            "Accept-Language":
              "es-ES,es;q=0.9,de-CH;q=0.7,de;q=0.6,pt;q=0.5,ru-RU;q=0.4",
          },
        }),
      });
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/ru");
    });

    it("should redirect with pathname and query params if there is no locale in the URL", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com/somepage?foo=bar"),
      });
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/en/somepage?foo=bar");
    });

    it("should not redirect if there is locale in the URL", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com/en/"),
      });
      const { response, pagesRouter, rootRouter } = handleI18n(req);
      expect(response).toBeUndefined();
      expect(pagesRouter).toBeDefined();
      expect(rootRouter).toBeDefined();
    });

    it("should not redirect if there is locale in the URL without trailings slash", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com/en"),
      });
      const { response, pagesRouter, rootRouter } = handleI18n(req);
      expect(response).toBeUndefined();
      expect(pagesRouter).toBeDefined();
      expect(rootRouter).toBeDefined();
    });

    it("should not redirect if there is locale in the URL with pathname and query params", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com/en/somepage?foo=bar"),
      });
      const { response, pagesRouter, rootRouter } = handleI18n(req);
      expect(response).toBeUndefined();
      expect(pagesRouter).toBeDefined();
      expect(rootRouter).toBeDefined();
    });

    it("should pageRouter that handleI18n returns works with locale", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com/en/somepage?foo=bar"),
      });
      const { pagesRouter } = handleI18n(req);
      const { route: pagesRoute } = pagesRouter?.match(req) || {};

      expect(pagesRoute).toBeDefined();
      expect(pagesRoute?.filePath).toBe(path.join(pagesDir, "somepage.tsx"));
    });
    it("should redirect to the correct browser locale", async () => {
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:1234/somepage"),
      });

      req.headers.set("Accept-Language", "en-US,en;q=0.5");

      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("Location")).toBe("/en/somepage");
    });

    it("should redirect to the correct default locale of the subdomain", async () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        IS_PRODUCTION: true,
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "es",
          domains: {
            "en.test.com": {
              defaultLocale: "en",
              protocol: "https",
            },
            "es.test.com": {
              defaultLocale: "es",
              protocol: "http",
            },
          },
        },
      };

      const { response } = handleI18n(
        extendRequestContext({
          originalRequest: new Request("https://en.test.com/somepage"),
        }),
      );

      const { response: responseEs } = handleI18n(
        extendRequestContext({
          originalRequest: new Request("https://es.test.com/somepage"),
        }),
      );

      expect(response?.status).toBe(301);
      expect(response?.headers.get("Location")).toBe(
        "https://en.test.com/en/somepage",
      );
      expect(responseEs?.status).toBe(301);
      expect(responseEs?.headers.get("Location")).toBe(
        "http://es.test.com/es/somepage",
      );
    });

    it("should redirect to the correct browser locale changing the subdomain", async () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        IS_PRODUCTION: true,
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "es",
          domains: {
            "en.test.com": {
              defaultLocale: "en",
            },
            "es.test.com": {
              defaultLocale: "es",
            },
          },
        },
      };

      const req = extendRequestContext({
        originalRequest: new Request("https://es.test.com/somepage"),
      });

      req.headers.set("Accept-Language", "en-US,en;q=0.5");

      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("Location")).toBe(
        "https://en.test.com/en/somepage",
      );
    });

    it("should redirect to the correct browser locale without changing the subdomain in development", async () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        IS_PRODUCTION: false,
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "es",
          domains: {
            "en.test.com": {
              defaultLocale: "en",
            },
            "es.test.com": {
              defaultLocale: "es",
            },
          },
        },
      };

      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:1234/somepage"),
      });

      req.headers.set("Accept-Language", "en-US,en;q=0.5");

      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("Location")).toBe("/en/somepage");
    });

    it("should redirect to the correct browser locale and changing the subdomain in development", async () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        IS_PRODUCTION: false,
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "es",
          domains: {
            "en.test.com": {
              defaultLocale: "en",
              dev: true,
            },
            "es.test.com": {
              defaultLocale: "es",
              dev: true,
            },
          },
        },
      };

      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:1234/somepage"),
      });

      req.headers.set("Accept-Language", "en-US,en;q=0.5");

      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("Location")).toBe(
        "https://en.test.com/en/somepage",
      );
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
        extendRequestContext({ originalRequest: req }),
      );

      expect(response).toBeUndefined();
      expect(pagesRouter).not.toBeDefined();
      expect(rootRouter).not.toBeDefined();
    });

    it("should redirect to default locale if there is no locale in the URL", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/en/");
    });

    it("should redirect to the browser language as default locale if there is no locale in the URL", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com", {
          headers: {
            "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          },
        }),
      });
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/ru/");
    });

    it("should redirect to the last browser language as default locale if there is no locale in the URL", () => {
      const req = extendRequestContext({
        originalRequest: new Request("https://example.com", {
          headers: {
            "Accept-Language":
              "es-ES,es;q=0.9,de-CH;q=0.7,de;q=0.6,pt;q=0.5,ru-RU;q=0.4",
          },
        }),
      });
      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("location")).toBe("/ru/");
    });

    it("should redirect to the correct browser locale", async () => {
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:1234/somepage"),
      });

      req.headers.set("Accept-Language", "en-US,en;q=0.5");

      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("Location")).toBe("/en/somepage/");
    });

    it("should redirect to the correct default locale of the subdomain", async () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        IS_PRODUCTION: true,
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "es",
          domains: {
            "en.test.com": {
              defaultLocale: "en",
              protocol: "https",
            },
            "es.test.com": {
              defaultLocale: "es",
              protocol: "http",
            },
          },
        },
      };

      const { response } = handleI18n(
        extendRequestContext({
          originalRequest: new Request("https://en.test.com/somepage"),
        }),
      );

      const { response: responseEs } = handleI18n(
        extendRequestContext({
          originalRequest: new Request("https://es.test.com/somepage"),
        }),
      );

      expect(response?.status).toBe(301);
      expect(response?.headers.get("Location")).toBe(
        "https://en.test.com/en/somepage/",
      );
      expect(responseEs?.status).toBe(301);
      expect(responseEs?.headers.get("Location")).toBe(
        "http://es.test.com/es/somepage/",
      );
    });

    it("should redirect to the correct browser locale changing the subdomain", async () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        IS_PRODUCTION: true,
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "es",
          domains: {
            "en.test.com": {
              defaultLocale: "en",
            },
            "es.test.com": {
              defaultLocale: "es",
            },
          },
        },
      };

      const req = extendRequestContext({
        originalRequest: new Request("https://es.test.com/somepage"),
      });

      req.headers.set("Accept-Language", "en-US,en;q=0.5");

      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("Location")).toBe(
        "https://en.test.com/en/somepage/",
      );
    });

    it("should redirect to the correct browser locale without changing the subdomain in development", async () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        IS_PRODUCTION: false,
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "es",
          domains: {
            "en.test.com": {
              defaultLocale: "en",
            },
            "es.test.com": {
              defaultLocale: "es",
            },
          },
        },
      };

      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:1234/somepage"),
      });

      req.headers.set("Accept-Language", "en-US,en;q=0.5");

      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("Location")).toBe("/en/somepage/");
    });

    it("should redirect to the correct browser locale and changing the subdomain in development", async () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        IS_PRODUCTION: false,
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "es",
          domains: {
            "en.test.com": {
              defaultLocale: "en",
              dev: true,
            },
            "es.test.com": {
              defaultLocale: "es",
              dev: true,
            },
          },
        },
      };

      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:1234/somepage"),
      });

      req.headers.set("Accept-Language", "en-US,en;q=0.5");

      const { response } = handleI18n(req);
      expect(response?.status).toBe(301);
      expect(response?.headers.get("Location")).toBe(
        "https://en.test.com/en/somepage/",
      );
    });
  });
});
