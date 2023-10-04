import path from "node:path";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "bun:test";
import getConstants from "../../constants";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

const ROOT_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGES_DIR = path.join(ROOT_DIR, "pages");
const ASSETS_DIR = path.join(ROOT_DIR, "assets");

async function testRequest(request: Request): Promise<Response> {
  const serveOptions = (await import("./serve-options")).serveOptions;

  return (
    // @ts-ignore
    (await serveOptions.fetch(request, { requestIP: () => { }, upgrade: () => { } }) ||
      new Response()) as Response
  );
}

describe("CLI: serve", () => {
  beforeAll(() => {
    GlobalRegistrator.unregister();
  });

  afterAll(() => {
    GlobalRegistrator.register();
  });

  beforeEach(async () => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      PAGES_DIR,
      ROOT_DIR,
      SRC_DIR: ROOT_DIR,
      ASSETS_DIR,
      I18N_CONFIG: {
        locales: ["en", "es"],
        defaultLocale: "es",
      },
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  it("should return 404 page", async () => {
    const response = await testRequest(
      new Request("http://localhost:1234/es/not-found-page"),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain("<h1>Page not found 404</h1>");
  });

  it("should return a page with layout and i18n", async () => {
    const response = await testRequest(
      new Request(`http://localhost:1234/es/somepage`),
    );
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain("<h1>Some page</h1>");
  });

  it("should be possible to fetch an api route GET", async () => {
    const response = await testRequest(
      new Request(`http:///localhost:1234/es/api/example`),
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
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ name: "Brisa", email: "test@brisa.com" });
  });
});
