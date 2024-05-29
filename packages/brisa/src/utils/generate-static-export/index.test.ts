import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from "bun:test";
import path from "node:path";
import fs from "node:fs";
import generateStaticExport from "./index";
import { getConstants } from "@/constants";
import { toInline } from "@/helpers";
import get404ClientScript from "@/utils/not-found/client-script";

const ROOT_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const SCRIPT_404 = get404ClientScript();
const mockFetch = mock((request: Request) => new Response(""));
const BASE_PATHS = ["", "some-dir", "/some-dir", "/es", "/some/dir"];
const mockWrite = mock(async (...args: any[]) => 0);
let spyWrite;

const testGeneratedContentByIndex = (index: number, content: string) => {
  expect(mockWrite.mock.calls[index][1]).toBe(content);
};

describe.each(BASE_PATHS)("utils", (basePath) => {
  function formatPath(...args: string[]) {
    const pathname = args.join(path.sep);
    let prefix = pathname[0] === path.sep ? "" : path.sep;
    return prefix + pathname;
  }

  describe("generate-static-export", () => {
    beforeEach(() => {
      spyWrite = spyOn(Bun, "write").mockImplementation((...args) =>
        mockWrite(...args),
      );
      mock.module("./utils", () => ({
        getServeOptions: async () => ({
          fetch: async (request: Request) =>
            mockFetch(request) ?? new Response(""),
        }),
      }));

      globalThis.mockConstants = {
        ...getConstants(),
        ROOT_DIR,
        BUILD_DIR: ROOT_DIR,
        CONFIG: {
          basePath,
        },
        IS_STATIC_EXPORT: true,
      };
    });

    afterEach(() => {
      mockFetch.mockRestore();
      mockWrite.mockRestore();
      spyWrite!.mockRestore();
      globalThis.mockConstants = undefined;
      mock.restore();
    });

    describe("when IS_STATIC_EXPORT=true", () => {
      it('should remove the "out" directory if it exists', async () => {
        globalThis.mockConstants = {
          ...getConstants(),
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          IS_PRODUCTION: true,
          CONFIG: {
            basePath,
          },
          IS_STATIC_EXPORT: true,
        };
        spyOn(fs, "existsSync").mockImplementationOnce(() => true);
        spyOn(fs, "rmSync").mockImplementationOnce(() => null);

        await generateStaticExport();

        expect(fs.rmSync).toHaveBeenCalled();
      });

      it("should generate static export to 'out' folder without i18n and without trailingSlash", () => {
        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [formatPath("pages", "_404.tsx"), [formatPath("_404.html")]],
            [formatPath("pages", "_500.tsx"), [formatPath("_500.html")]],
            [formatPath("pages", "foo.tsx"), [formatPath("foo.html")]],
            [
              formatPath("pages", "page-with-web-component.tsx"),
              [formatPath("page-with-web-component.html")],
            ],
            [
              formatPath("pages", "somepage.tsx"),
              [formatPath("somepage.html")],
            ],
            [
              formatPath("pages", "somepage-with-context.tsx"),
              [formatPath("somepage-with-context.html")],
            ],
            [formatPath("pages", "index.tsx"), [formatPath("index.html")]],
            [
              formatPath("pages", "user", "[username].tsx"),
              [formatPath("user", "testUserName.html")],
            ],
          ]),
          path.join(ROOT_DIR, "out", basePath),
        ]);

        expect(mockWrite.mock.calls[0][0]).toStartWith(
          path.join(ROOT_DIR, "out"),
        );
      });

      it("should generate static export with i18n with a soft redirect to the locale", () => {
        globalThis.mockConstants = {
          ...getConstants(),
          ROOT_DIR,
          CONFIG: {
            basePath,
          },
          IS_STATIC_EXPORT: true,
          BUILD_DIR: ROOT_DIR,
          I18N_CONFIG: {
            locales: ["en", "pt"],
            defaultLocale: "en",
            pages: {
              "/somepage": {
                en: "/somepage",
                pt: "/alguma-pagina",
              },
              "/somepage-with-context": {
                en: "/somepage-with-context",
                pt: "/alguma-pagina-com-contexto",
              },
              "/page-with-web-component": {
                en: "/page-with-web-component",
                pt: "/pagina-com-web-component",
              },
              "/user/[username]": {
                en: "/user/[username]",
                pt: "/usuario/[username]",
              },
            },
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "_404.tsx"),
              [formatPath("en", "_404.html"), formatPath("pt", "_404.html")],
            ],
            [
              formatPath("pages", "_500.tsx"),
              [formatPath("en", "_500.html"), formatPath("pt", "_500.html")],
            ],
            [
              formatPath("pages", "foo.tsx"),
              [formatPath("en", "foo.html"), formatPath("pt", "foo.html")],
            ],
            [
              formatPath("pages", "page-with-web-component.tsx"),
              [
                formatPath("en", "page-with-web-component.html"),
                formatPath("pt", "pagina-com-web-component.html"),
              ],
            ],
            [
              formatPath("pages", "somepage.tsx"),
              [
                formatPath("en", "somepage.html"),
                formatPath("pt", "alguma-pagina.html"),
              ],
            ],
            [
              formatPath("pages", "somepage-with-context.tsx"),
              [
                formatPath("en", "somepage-with-context.html"),
                formatPath("pt", "alguma-pagina-com-contexto.html"),
              ],
            ],
            [
              formatPath("pages", "index.tsx"),
              [formatPath("en.html"), formatPath("pt.html")],
            ],
            [
              formatPath("pages", "user", "[username].tsx"),
              [
                formatPath("en", "user", "testUserName.html"),
                formatPath("pt", "usuario", "testUserName.html"),
              ],
            ],
            // Soft redirect to the locale
            [formatPath("/"), [formatPath("index.html")]],
          ]),
          path.join(ROOT_DIR, "out", basePath),
        ]);

        const expectedSoftRedirectCode = toInline(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta http-equiv="refresh" content="0; url=/en">
            <link rel="canonical" href="/en">
            <script>
              const browserLanguage = (navigator.language || navigator.userLanguage).toLowerCase();
              const shortBrowserLanguage = browserLanguage.split("-")[0];
              const supportedLocales = ["en","pt"];

              if (supportedLocales.includes(shortBrowserLanguage)) {
                window.location.href = "/" + "${basePath}" + shortBrowserLanguage;
              } else if (supportedLocales.includes(browserLanguage)) {
                window.location.href = "/" + "${basePath}" + browserLanguage;
              } else {
                window.location.href = "/" + "${basePath}" + "en";
              }
            </script>
          </head>
          <body />
        </html>
      `);

        testGeneratedContentByIndex(16, expectedSoftRedirectCode);
      });

      it("should generate static export with trailingSlash", () => {
        const constants = getConstants();
        globalThis.mockConstants = {
          ...constants,
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          CONFIG: {
            ...constants.CONFIG,
            trailingSlash: true,
            basePath,
          },
          IS_STATIC_EXPORT: true,
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "_404.tsx"),
              [formatPath("_404", "index.html")],
            ],
            [
              formatPath("pages", "_500.tsx"),
              [formatPath("_500", "index.html")],
            ],
            [formatPath("pages", "foo.tsx"), [formatPath("foo", "index.html")]],
            [
              formatPath("pages", "page-with-web-component.tsx"),
              [formatPath("page-with-web-component", "index.html")],
            ],
            [
              formatPath("pages", "somepage.tsx"),
              [formatPath("somepage", "index.html")],
            ],
            [
              formatPath("pages", "somepage-with-context.tsx"),
              [formatPath("somepage-with-context", "index.html")],
            ],
            [formatPath("pages", "index.tsx"), [formatPath("index.html")]],
            [
              formatPath("pages", "user", "[username].tsx"),
              [formatPath("user", "testUserName", "index.html")],
            ],
          ]),
          path.join(ROOT_DIR, "out", basePath),
        ]);
      });

      it('should move all the assets inside the "out" folder', async () => {
        spyOn(fs, "cpSync").mockImplementationOnce(() => null);

        await generateStaticExport();

        expect(fs.cpSync).toHaveBeenCalledTimes(2);
        expect(fs.cpSync).toHaveBeenCalledWith(
          path.join(ROOT_DIR, "public"),
          path.join(ROOT_DIR, "out", basePath),
          { recursive: true },
        );
      });

      it("should move all JS client code files inside _brisa/pages folder", async () => {
        spyOn(fs, "cpSync").mockImplementationOnce(() => null);

        await generateStaticExport();

        expect(fs.cpSync).toHaveBeenCalledTimes(2);
        expect(fs.cpSync).toHaveBeenCalledWith(
          path.join(ROOT_DIR, "pages-client"),
          path.join(ROOT_DIR, "out", basePath, "_brisa", "pages"),
          { recursive: true },
        );
      });

      it('should warn about redirect when "i18n" is defined', async () => {
        const mockLog = mock((...args: any[]) => null);
        globalThis.mockConstants = {
          ...getConstants(),
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          I18N_CONFIG: {
            locales: ["en", "pt"],
            defaultLocale: "en",
          },
          IS_STATIC_EXPORT: true,
          CONFIG: {
            basePath,
          },
        };
        spyOn(console, "log").mockImplementation((...args) => mockLog(...args));

        await generateStaticExport();

        const logs = mockLog.mock.calls.flat().toString();
        const expectedTitle =
          "Unable to generate a hard redirect to the user browser language.";
        const expectedDocs =
          "https://brisa.build/building-your-application/deploying/static-exports#hard-redirects";
        expect(logs).toContain("Ops! Warning:");
        expect(logs).toContain(expectedTitle);
        expect(logs).toContain(expectedDocs);
      });

      it('should not warn about redirect when "i18n" is not defined', async () => {
        const constants = getConstants();

        const mockLog = spyOn(console, "log").mockImplementation(() => null);

        await generateStaticExport();

        // All are correct logs withouth the warning
        expect(mockLog).toHaveBeenCalledTimes(9);
        expect(mockLog.mock.calls[0]).toEqual([constants.LOG_PREFIX.INFO]);
        expect(mockLog.mock.calls[1]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/_404.html prerendered "),
        ]);
        expect(mockLog.mock.calls[2]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/_500.html prerendered in "),
        ]);
        expect(mockLog.mock.calls[3]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/foo.html prerendered in "),
        ]);
        expect(mockLog.mock.calls[4]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining(
            "/page-with-web-component.html prerendered in ",
          ),
        ]);
        expect(mockLog.mock.calls[5]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/somepage.html prerendered in "),
        ]);
        expect(mockLog.mock.calls[6]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining(
            "/somepage-with-context.html prerendered in ",
          ),
        ]);
        expect(mockLog.mock.calls[7]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/index.html prerendered in "),
        ]);
        expect(mockLog.mock.calls[8]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/user/testUserName.html prerendered in "),
        ]);
      });

      it("should not generate a page that during the streaming returns the soft redirect to 404 (notFound method)", () => {
        mockFetch.mockImplementation(() => new Response(SCRIPT_404));

        expect(generateStaticExport()).resolves.toEqual([
          new Map(),
          path.join(ROOT_DIR, "out", basePath),
        ]);
        expect(mockWrite).not.toHaveBeenCalled();
      });

      it("should warn an error with a dynamic page without prerender function", () => {
        const mockLog = mock((...args: any[]) => null);
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "dynamic-route",
        );

        spyOn(console, "log").mockImplementation((...args) => mockLog(...args));

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: true,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map(),
          path.join(dynamicPath, "out", basePath),
        ]);

        const logs = mockLog.mock.calls.flat().toString();

        expect(logs).toContain("Ops! Warning:");
        expect(logs).toContain(
          'The dynamic route "/[slug]" does not have a "prerender" function.',
        );
      });

      it("should warn an error with a [...rest] page without prerender function", () => {
        const mockLog = mock((...args: any[]) => null);
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "dynamic-rest-route",
        );

        spyOn(console, "log").mockImplementation((...args) => mockLog(...args));

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: true,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map(),
          path.join(dynamicPath, "out", basePath),
        ]);

        const logs = mockLog.mock.calls.flat().toString();

        expect(logs).toContain("Ops! Warning:");
        expect(logs).toContain(
          'The dynamic route "/[...rest]" does not have a "prerender" function.',
        );
      });

      it("should warn an error with a [[...catchall]] page without prerender function", () => {
        const mockLog = mock((...args: any[]) => null);
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "dynamic-catchall-route",
        );

        spyOn(console, "log").mockImplementation((...args) => mockLog(...args));

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: true,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map(),
          path.join(dynamicPath, "out", basePath),
        ]);

        const logs = mockLog.mock.calls.flat().toString();

        expect(logs).toContain("Ops! Warning:");
        expect(logs).toContain(
          'The dynamic route "/[[...catchall]]" does not have a "prerender" function.',
        );
      });

      it("should generate dynamic routes thanks to prerender function", () => {
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "dynamic-route-prerender",
        );

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: true,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "[slug].tsx"),
              [formatPath("user.html"), formatPath("user2.html")],
            ],
          ]),
          path.join(dynamicPath, "out", basePath),
        ]);
      });

      it("should generate nested dynamic routes thanks to prerender function", () => {
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "nested-dynamic-route-prerender",
        );

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: true,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "[foo]", "index.tsx"),
              [
                formatPath("foo.html"),
                formatPath("bar.html"),
                formatPath("baz.html"),
              ],
            ],
            [
              formatPath("pages", "[foo]", "[slug].tsx"),
              [
                formatPath("foo", "user.html"),
                formatPath("bar", "user.html"),
                formatPath("baz", "user.html"),
                formatPath("foo", "user2.html"),
                formatPath("bar", "user2.html"),
                formatPath("baz", "user2.html"),
              ],
            ],
          ]),
          path.join(dynamicPath, "out", basePath),
        ]);
      });

      it("should generate dynamic rest routes thanks to prerender function", () => {
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "dynamic-rest-route-prerender",
        );

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: true,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "[...rest].tsx"),
              [
                formatPath("foo", "bar", "baz.html"),
                formatPath("foo", "bar", "baz", "qux.html"),
              ],
            ],
          ]),
          path.join(dynamicPath, "out", basePath),
        ]);
      });

      it("should generate dynamic catchall routes thanks to prerender function an array of strings", () => {
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          // This route returns an array of strings
          "dynamic-catchall-route-prerender",
        );

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: true,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "[[...catchall]].tsx"),
              [
                formatPath("a", "b", "c.html"),
                formatPath("a", "b.html"),
                formatPath("a.html"),
              ],
            ],
          ]),
          path.join(dynamicPath, "out", basePath),
        ]);
      });

      it("should prerender all routes althought only one has prerender=true (IS_STATIC_EXPORT=true do all)", () => {
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "prerender-one",
        );

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: true,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [formatPath("pages", "a.tsx"), [formatPath("a.html")]],
            [formatPath("pages", "b.tsx"), [formatPath("b.html")]],
            [formatPath("pages", "c.tsx"), [formatPath("c.html")]],
          ]),
          path.join(dynamicPath, "out", basePath),
        ]);
      });
    });

    describe("when IS_STATIC_EXPORT=false", () => {
      it('should NOT remove the "build" directory if it exists', async () => {
        globalThis.mockConstants = {
          ...getConstants(),
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          IS_PRODUCTION: true,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };
        spyOn(fs, "existsSync").mockImplementationOnce(() => true);
        spyOn(fs, "rmSync").mockImplementationOnce(() => null);

        await generateStaticExport();

        expect(fs.rmSync).not.toHaveBeenCalled();
      });

      it("should NOT warn an error with a dynamic page without prerender function", () => {
        const mockLog = mock((...args: any[]) => null);
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "dynamic-route",
        );

        spyOn(console, "log").mockImplementation((...args) => mockLog(...args));

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map(),
          path.join(dynamicPath, "prerendered-pages"),
        ]);
        expect(mockLog).not.toHaveBeenCalled();
      });

      it("should NOT warn an error with a [...rest] page without prerender function", () => {
        const mockLog = mock((...args: any[]) => null);
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "dynamic-rest-route",
        );

        spyOn(console, "log").mockImplementation((...args) => mockLog(...args));

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map(),
          path.join(dynamicPath, "prerendered-pages"),
        ]);
        expect(mockLog).not.toHaveBeenCalled();
      });

      it("should NOT warn an error with a [[...catchall]] page without prerender function", () => {
        const mockLog = mock((...args: any[]) => null);
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "dynamic-catchall-route",
        );

        spyOn(console, "log").mockImplementation((...args) => mockLog(...args));

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map(),
          path.join(dynamicPath, "prerendered-pages"),
        ]);
        expect(mockLog).not.toHaveBeenCalled();
      });

      it("should NOT generate a soft redirect to the locale (with i18n)", () => {
        globalThis.mockConstants = {
          ...getConstants(),
          ROOT_DIR,
          IS_STATIC_EXPORT: false,
          BUILD_DIR: ROOT_DIR,
          CONFIG: {
            basePath,
          },
          I18N_CONFIG: {
            locales: ["en", "pt"],
            defaultLocale: "en",
            pages: {
              "/user/[username]": {
                en: "/user/[username]",
                pt: "/usuario/[username]",
              },
            },
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "user", "[username].tsx"),
              [
                formatPath("en", "user", "testUserName.html"),
                formatPath("pt", "usuario", "testUserName.html"),
              ],
            ],
          ]),
          path.join(ROOT_DIR, "prerendered-pages"),
        ]);
      });

      it('should NOT move assets neither client code inside the "out" folder', () => {
        const constants = getConstants();
        globalThis.mockConstants = {
          ...constants,
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };
        spyOn(fs, "cpSync").mockImplementationOnce(() => null);

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "user", "[username].tsx"),
              [formatPath("user", "testUserName.html")],
            ],
          ]),
          path.join(ROOT_DIR, "prerendered-pages"),
        ]);

        expect(fs.cpSync).toHaveBeenCalledTimes(0);
      });

      it('should NOT warn about redirect when "i18n"', () => {
        const mockLog = mock((...args: any[]) => null);
        const constants = getConstants();
        globalThis.mockConstants = {
          ...constants,
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          I18N_CONFIG: {
            locales: ["en", "pt"],
            defaultLocale: "en",
          },
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };
        spyOn(console, "log").mockImplementation((...args) => mockLog(...args));

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "user", "[username].tsx"),
              [
                formatPath("en", "user", "testUserName.html"),
                formatPath("pt", "user", "testUserName.html"),
              ],
            ],
          ]),
          path.join(ROOT_DIR, "prerendered-pages"),
        ]);

        expect(mockLog).toHaveBeenCalledTimes(5);
        expect(mockLog.mock.calls[0]).toEqual([constants.LOG_PREFIX.INFO]);
        expect(mockLog.mock.calls[1]).toEqual([
          constants.LOG_PREFIX.WAIT,
          "📄 Prerendering pages...",
        ]);
        expect(mockLog.mock.calls[2]).toEqual([constants.LOG_PREFIX.INFO]);
        expect(mockLog.mock.calls[3]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/en/user/testUserName.html prerendered in "),
        ]);
        expect(mockLog.mock.calls[4]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/pt/user/testUserName.html prerendered in "),
        ]);
      });

      it('should NOT warn about redirect when "i18n" neither when i18n is not defined', () => {
        const constants = getConstants();
        globalThis.mockConstants = {
          ...constants,
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };
        const mockLog = spyOn(console, "log").mockImplementation(() => null);

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "user", "[username].tsx"),
              [formatPath("user", "testUserName.html")],
            ],
          ]),
          path.join(ROOT_DIR, "prerendered-pages"),
        ]);

        expect(mockLog).toHaveBeenCalledTimes(4);
        expect(mockLog.mock.calls[0]).toEqual([constants.LOG_PREFIX.INFO]);
        expect(mockLog.mock.calls[1]).toEqual([
          constants.LOG_PREFIX.WAIT,
          "📄 Prerendering pages...",
        ]);
        expect(mockLog.mock.calls[2]).toEqual([constants.LOG_PREFIX.INFO]);
        expect(mockLog.mock.calls[3]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/user/testUserName.html prerendered in "),
        ]);
      });

      it("should NOT generate a page that during the streaming returns the soft redirect to 404 (notFound method)", () => {
        globalThis.mockConstants = {
          ...getConstants(),
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };
        mockFetch.mockImplementation(() => new Response(SCRIPT_404));

        expect(generateStaticExport()).resolves.toEqual([
          new Map(),
          path.join(ROOT_DIR, "prerendered-pages"),
        ]);
      });

      it("should prerender dynamic routes without i18n and without trailingSlash", () => {
        mockConstants = {
          ...getConstants(),
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "user", "[username].tsx"),
              [formatPath("user", "testUserName.html")],
            ],
          ]),
          path.join(ROOT_DIR, "prerendered-pages"),
        ]);

        expect(mockWrite.mock.calls[0][0]).toStartWith(
          path.join(ROOT_DIR, "prerendered-pages", "user", "testUserName.html"),
        );
      });

      it("should prerender dynamic route with trailingSlash", () => {
        const constants = getConstants();
        globalThis.mockConstants = {
          ...constants,
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          CONFIG: {
            ...constants.CONFIG,
            trailingSlash: true,
            basePath,
          },
          IS_STATIC_EXPORT: false,
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "user", "[username].tsx"),
              [formatPath("user", "testUserName", "index.html")],
            ],
          ]),
          path.join(ROOT_DIR, "prerendered-pages"),
        ]);
      });

      it("should generate dynamic routes thanks to prerender function", () => {
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "dynamic-route-prerender",
        );

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "[slug].tsx"),
              [formatPath("user.html"), formatPath("user2.html")],
            ],
          ]),
          path.join(dynamicPath, "prerendered-pages"),
        ]);
      });

      it("should generate nested dynamic routes thanks to prerender function", () => {
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "nested-dynamic-route-prerender",
        );

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "[foo]", "index.tsx"),
              [
                formatPath("foo.html"),
                formatPath("bar.html"),
                formatPath("baz.html"),
              ],
            ],
            [
              formatPath("pages", "[foo]", "[slug].tsx"),
              [
                formatPath("foo", "user.html"),
                formatPath("bar", "user.html"),
                formatPath("baz", "user.html"),
                formatPath("foo", "user2.html"),
                formatPath("bar", "user2.html"),
                formatPath("baz", "user2.html"),
              ],
            ],
          ]),
          path.join(dynamicPath, "prerendered-pages"),
        ]);
      });

      it("should generate dynamic rest routes thanks to prerender function", () => {
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "dynamic-rest-route-prerender",
        );

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "[...rest].tsx"),
              [
                formatPath("foo", "bar", "baz.html"),
                formatPath("foo", "bar", "baz", "qux.html"),
              ],
            ],
          ]),
          path.join(dynamicPath, "prerendered-pages"),
        ]);
      });

      it("should generate dynamic catchall routes thanks to prerender function an array of strings", () => {
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          // This route returns an array of strings
          "dynamic-catchall-route-prerender",
        );

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([
            [
              formatPath("pages", "[[...catchall]].tsx"),
              [
                formatPath("a", "b", "c.html"),
                formatPath("a", "b.html"),
                formatPath("a.html"),
              ],
            ],
          ]),
          path.join(dynamicPath, "prerendered-pages"),
        ]);
      });

      it("should prerender only the route with prerender=true", () => {
        const dynamicPath = path.join(
          import.meta.dir,
          "__fixtures__",
          "prerender-one",
        );

        mockConstants = {
          ...getConstants(),
          ROOT_DIR: dynamicPath,
          BUILD_DIR: dynamicPath,
          IS_STATIC_EXPORT: false,
          CONFIG: {
            basePath,
          },
        };

        expect(generateStaticExport()).resolves.toEqual([
          new Map([[formatPath("pages", "b.tsx"), [formatPath("/b.html")]]]),
          path.join(dynamicPath, "prerendered-pages"),
        ]);
      });
    });
  });
});
