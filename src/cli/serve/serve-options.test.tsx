import path from "node:path";
import fs from "node:fs";
import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import getConstants from "../../constants";
import { BunFile } from "bun";

const BUILD_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGES_DIR = path.join(BUILD_DIR, "pages");
const ASSETS_DIR = path.join(BUILD_DIR, "public");

async function testRequest(request: Request): Promise<Response> {
  const serveOptions = (await import("./serve-options")).serveOptions;

  return (
    // @ts-ignore
    ((await serveOptions.fetch(request, {
      requestIP: () => {},
      upgrade: () => {},
    })) || new Response()) as Response
  );
}

describe("CLI: serve", () => {
  beforeEach(async () => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      PAGES_DIR,
      BUILD_DIR,
      SRC_DIR: BUILD_DIR,
      ASSETS_DIR,
      LOCALES_SET: new Set(["en", "es"]),
      I18N_CONFIG: {
        locales: ["en", "es"],
        defaultLocale: "es",
      },
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  it("should return 404 page without redirect to the locale if the page doesn't exist", async () => {
    const response = await testRequest(
      new Request("http://localhost:1234/not-found-page")
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain("<h1>Page not found 404</h1>");
  });

  it("should return 404 page without redirect to the trailingSlash if the page doesn't exist", async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        trailingSlash: true,
      },
    };
    const response = await testRequest(
      new Request("http://localhost:1234/es/not-found-page")
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain("<h1>Page not found 404</h1>");
  });

  it("should return 404 page without redirect to the locale and trailingSlash if the page doesn't exist", async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        trailingSlash: true,
      },
    };
    const response = await testRequest(
      new Request("http://localhost:1234/not-found-page")
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain("<h1>Page not found 404</h1>");
  });

  it("should return 404 page", async () => {
    const response = await testRequest(
      new Request("http://localhost:1234/es/not-found-page")
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain("<h1>Page not found 404</h1>");
  });

  it("should return 200 page with web component", async () => {
    const mockFs = spyOn(fs, "existsSync").mockImplementation(() => true);
    const mockFile = spyOn(Bun, "file").mockImplementation(
      () =>
        ({
          text: () => Promise.resolve("I am a web component JS code"),
        } as BunFile)
    );

    const response = await testRequest(
      new Request("http://localhost:1234/es/page-with-web-component")
    );
    const html = await response.text();

    mockFs.mockRestore();
    mockFile.mockRestore();

    expect(response.status).toBe(200);
    expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain("<script>I am a web component JS code</script>");
    expect(html).toContain(
      '<native-some-example name="web component"></native-some-example>'
    );
  });

  it("should redirect the home to the correct locale", async () => {
    const response = await testRequest(new Request("http://localhost:1234"));
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("/es");
  });

  it("should redirect the home to the correct locale and trailingSlash", async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        trailingSlash: true,
      },
    };
    const response = await testRequest(new Request("http://localhost:1234/"));
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("/es/");
  });

  it("should redirect to the correct locale", async () => {
    const response = await testRequest(
      new Request(`http://localhost:1234/somepage`)
    );
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("/es/somepage");
  });

  it("should redirect to the correct browser locale", async () => {
    const req = new Request("http://localhost:1234/somepage");

    req.headers.set("Accept-Language", "en-US,en;q=0.5");

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("/en/somepage");
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

    const response = await testRequest(
      new Request("https://en.test.com/somepage")
    );

    const responseEs = await testRequest(
      new Request("https://es.test.com/somepage")
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe(
      "https://en.test.com/en/somepage"
    );
    expect(responseEs.status).toBe(301);
    expect(responseEs.headers.get("Location")).toBe(
      "http://es.test.com/es/somepage"
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

    const req = new Request("https://es.test.com/somepage");

    req.headers.set("Accept-Language", "en-US,en;q=0.5");

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe(
      "https://en.test.com/en/somepage"
    );
  });

  it("should redirect to the correct browser locale changing the subdomain and the page route name", async () => {
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
        pages: {
          "/somepage": {
            en: "/somepage-en",
          },
        },
      },
    };

    const req = new Request("https://es.test.com/somepage");

    req.headers.set("Accept-Language", "en-US,en;q=0.5");

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe(
      "https://en.test.com/en/somepage-en"
    );
  });

  it("should redirect to the correct browser locale changing the subdomain, adding trailing slash and translating the route name", async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      CONFIG: {
        trailingSlash: true,
      },
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
        pages: {
          "/somepage": {
            en: "/somepage-en",
          },
        },
      },
    };

    const req = new Request("https://es.test.com/somepage");

    req.headers.set("Accept-Language", "en-US,en;q=0.5");

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe(
      "https://en.test.com/en/somepage-en/"
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

    const req = new Request("http://localhost:1234/somepage");

    req.headers.set("Accept-Language", "en-US,en;q=0.5");

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("/en/somepage");
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

    const req = new Request("http://localhost:1234/somepage");

    req.headers.set("Accept-Language", "en-US,en;q=0.5");

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe(
      "https://en.test.com/en/somepage"
    );
  });

  it("should redirect to the correct browser locale changing the subdomain and trailingSlash", async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      CONFIG: {
        trailingSlash: true,
      },
      I18N_CONFIG: {
        locales: ["en", "es"],
        defaultLocale: "es",
        domains: {
          "en.test.com": {
            defaultLocale: "en",
            protocol: "http",
          },
          "es.test.com": {
            defaultLocale: "es",
          },
        },
      },
    };

    const req = new Request("http://es.test.com/somepage");

    req.headers.set("Accept-Language", "en-US,en;q=0.5");

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe(
      "http://en.test.com/en/somepage/"
    );
  });

  it("should redirect with trailingSlash", async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        trailingSlash: true,
      },
    };
    const response = await testRequest(
      new Request(`http://localhost:1234/es/somepage`)
    );
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe(
      "http://localhost:1234/es/somepage/"
    );
  });

  it("should redirect with locale and trailingSlash", async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        trailingSlash: true,
      },
    };
    const response = await testRequest(
      new Request(`http://localhost:1234/somepage`)
    );
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("/es/somepage/");
  });

  it("should return a page with layout and i18n", async () => {
    const response = await testRequest(
      new Request(`http://localhost:1234/es/somepage`)
    );
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="es" dir="ltr">');
    expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain("<h1>Some page</h1>");
  });

  it("should be possible to fetch an api route GET", async () => {
    const response = await testRequest(
      new Request(`http:///localhost:1234/es/api/example`)
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ hello: "world" });
  });

  it("should be possible to fetch an api route POST with a FormData", async () => {
    const body = new FormData();

    body.append("name", "Brisa");
    body.append("email", "test@brisa.com");

    const response = await testRequest(
      new Request(`http:///localhost:1234/es/api/example`, {
        method: "POST",
        body,
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ name: "Brisa", email: "test@brisa.com" });
  });

  it("should return 404 page if the api route does not exist", async () => {
    const response = await testRequest(
      new Request(`http:///localhost:1234/es/api/not-found`)
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain("<h1>Page not found 404</h1>");
  });

  it("should return 404 page if the api route exist but the method does not", async () => {
    const response = await testRequest(
      new Request(`http:///localhost:1234/es/api/example`, {
        method: "PUT",
      })
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain("<h1>Page not found 404</h1>");
  });
});
