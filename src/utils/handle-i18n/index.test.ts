import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import path from "node:path";
import handleI18n from ".";
import { BunriseRequest } from "../../bunrise";

const rootDir = path.join(import.meta.dir, "..", "..", "__fixtures__");
const pagesDir = path.join(rootDir, "pages");

describe("handleI18n util", () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      I18N_CONFIG: {
        locales: ["en", "ru"],
        defaultLocale: "en",
      },
      ROOT_DIR: rootDir,
      PAGES_DIR: pagesDir,
      RESERVED_PAGES: ["/_404", "/_500"],
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  it("should not do anything if there is no i18n config", () => {
    globalThis.mockConstants = {};
    const req = new Request("https://example.com");
    const { response, pagesRouter, rootRouter } = handleI18n(
      new BunriseRequest(req),
    );

    expect(response).toBeUndefined();
    expect(pagesRouter).not.toBeDefined();
    expect(rootRouter).not.toBeDefined();
  });

  it("should redirect to default locale if there is no locale in the URL", () => {
    const req = new BunriseRequest(new Request("https://example.com"));
    const { response } = handleI18n(req);
    expect(response?.status).toBe(301);
    expect(response?.headers.get("location")).toBe("/en/");
  });

  it("should redirect with pathname and query params if there is no locale in the URL", () => {
    const req = new BunriseRequest(
      new Request("https://example.com/somepage?foo=bar"),
    );
    const { response } = handleI18n(req);
    expect(response?.status).toBe(301);
    expect(response?.headers.get("location")).toBe("/en/somepage?foo=bar");
  });

  it("should not redirect if there is locale in the URL", () => {
    const req = new BunriseRequest(new Request("https://example.com/en/"));
    const { response, pagesRouter, rootRouter } = handleI18n(req);
    expect(response).toBeUndefined();
    expect(pagesRouter).toBeDefined();
    expect(rootRouter).toBeDefined();
  });

  it("should not redirect if there is locale in the URL with pathname and query params", () => {
    const req = new BunriseRequest(
      new Request("https://example.com/en/somepage?foo=bar"),
    );
    const { response, pagesRouter, rootRouter } = handleI18n(req);
    expect(response).toBeUndefined();
    expect(pagesRouter).toBeDefined();
    expect(rootRouter).toBeDefined();
  });

  it("should pageRouter that handleI18n returns works with locale", () => {
    const req = new BunriseRequest(
      new Request("https://example.com/en/somepage?foo=bar"),
    );
    const { pagesRouter } = handleI18n(req);
    const { route: pagesRoute } = pagesRouter?.match(req) || {};

    expect(pagesRoute).toBeDefined();
    expect(pagesRoute?.filePath).toBe(path.join(pagesDir, "somepage.tsx"));
  });
});
