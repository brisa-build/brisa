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

const fakeOrigin = "http://localhost";
const ROOT_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const mockFetch = mock((request: Request) => new Response(""));
const mockWrite = mock(async (...args: any[]) => 0);
let spyWrite;

const getPathname = (...paths: string[]) => {
  return new URL(path.join(...paths), fakeOrigin).pathname;
};

const testGeneratedContentByIndex = (index: number, content: string) => {
  expect(mockWrite.mock.calls[index][1]).toBe(content);
};

describe("utils", () => {
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
      it("should generate static export to 'out' folder without i18n and without trailingSlash", () => {
        expect(generateStaticExport()).resolves.toEqual([
          getPathname("_404.html"),
          getPathname("_500.html"),
          getPathname("page-with-web-component.html"),
          getPathname("somepage.html"),
          getPathname("somepage-with-context.html"),
          getPathname("index.html"),
          getPathname("user", "testUserName.html"),
        ]);
        expect(mockWrite.mock.calls[0][0]).toStartWith(
          path.join(ROOT_DIR, "out"),
        );
      });

      it("should generate static export with i18n with a soft redirect to the locale", () => {
        globalThis.mockConstants = {
          ...getConstants(),
          ROOT_DIR,
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
          getPathname("en", "_404.html"),
          getPathname("pt", "_404.html"),
          getPathname("en", "_500.html"),
          getPathname("pt", "_500.html"),
          getPathname("en", "page-with-web-component.html"),
          getPathname("pt", "pagina-com-web-component.html"),
          getPathname("en", "somepage.html"),
          getPathname("pt", "alguma-pagina.html"),
          getPathname("en", "somepage-with-context.html"),
          getPathname("pt", "alguma-pagina-com-contexto.html"),
          getPathname("en.html"),
          getPathname("pt.html"),
          getPathname("en", "user", "testUserName.html"),
          getPathname("pt", "usuario", "testUserName.html"),
          getPathname("index.html"), // Soft redirect to default locale
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
                window.location.href = "/" + shortBrowserLanguage;
              } else if (supportedLocales.includes(browserLanguage)) {
                window.location.href = "/" + browserLanguage;
              } else {
                window.location.href = "/en";
              }
            </script>
          </head>
          <body />
        </html>
      `);

        testGeneratedContentByIndex(14, expectedSoftRedirectCode);
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
          },
          IS_STATIC_EXPORT: true,
        };

        expect(generateStaticExport()).resolves.toEqual([
          getPathname("_404", "index.html"),
          getPathname("_500", "index.html"),
          getPathname("page-with-web-component", "index.html"),
          getPathname("somepage", "index.html"),
          getPathname("somepage-with-context", "index.html"),
          getPathname("index.html"),
          getPathname("user", "testUserName", "index.html"),
        ]);
      });

      it('should move all the assets inside the "out" folder', async () => {
        spyOn(fs, "cpSync").mockImplementationOnce(() => null);

        await generateStaticExport();

        expect(fs.cpSync).toHaveBeenCalledTimes(2);
        expect(fs.cpSync).toHaveBeenCalledWith(
          path.join(ROOT_DIR, "public"),
          path.join(ROOT_DIR, "out"),
          { recursive: true },
        );
      });

      it("should move all JS client code files inside _brisa/pages folder", async () => {
        spyOn(fs, "cpSync").mockImplementationOnce(() => null);

        await generateStaticExport();

        expect(fs.cpSync).toHaveBeenCalledTimes(2);
        expect(fs.cpSync).toHaveBeenCalledWith(
          path.join(ROOT_DIR, "pages-client"),
          path.join(ROOT_DIR, "out", "_brisa", "pages"),
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
        expect(mockLog).toHaveBeenCalledTimes(8);
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
          expect.stringContaining(
            "/page-with-web-component.html prerendered in ",
          ),
        ]);
        expect(mockLog.mock.calls[4]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/somepage.html prerendered in "),
        ]);
        expect(mockLog.mock.calls[5]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining(
            "/somepage-with-context.html prerendered in ",
          ),
        ]);
        expect(mockLog.mock.calls[6]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/index.html prerendered in "),
        ]);
        expect(mockLog.mock.calls[7]).toEqual([
          constants.LOG_PREFIX.INFO,
          constants.LOG_PREFIX.TICK,
          expect.stringContaining("/user/testUserName.html prerendered in "),
        ]);
      });

      it("should not generate a page that during the streaming returns the soft redirect to 404 (notFound method)", () => {
        const constants = getConstants();
        mockFetch.mockImplementation(() => new Response(constants.SCRIPT_404));

        expect(generateStaticExport()).resolves.toBeEmpty();

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
        };

        expect(generateStaticExport()).resolves.toBeEmpty();

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
        };

        expect(generateStaticExport()).resolves.toBeEmpty();

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
        };

        expect(generateStaticExport()).resolves.toBeEmpty();

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
        };

        expect(generateStaticExport()).resolves.toEqual([
          "/user.html",
          "/user2.html",
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
        };

        expect(generateStaticExport()).resolves.toEqual([
          "/foo.html",
          "/bar.html",
          "/baz.html",
          "/foo/user.html",
          "/bar/user.html",
          "/baz/user.html",
          "/foo/user2.html",
          "/bar/user2.html",
          "/baz/user2.html",
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
        };

        expect(generateStaticExport()).resolves.toEqual([
          "/foo/bar/baz.html",
          "/foo/bar/baz/qux.html",
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
        };

        expect(generateStaticExport()).resolves.toEqual([
          "/a/b/c.html",
          "/a/b.html",
          "/a.html",
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
        };

        expect(generateStaticExport()).resolves.toEqual([
          "/a.html",
          "/b.html",
          "/c.html",
        ]);
      });
    });

    describe("when IS_STATIC_EXPORT=false", () => {
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
        };

        expect(generateStaticExport()).resolves.toBeEmpty();
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
        };

        expect(generateStaticExport()).resolves.toBeEmpty();
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
        };

        expect(generateStaticExport()).resolves.toBeEmpty();
        expect(mockLog).not.toHaveBeenCalled();
      });

      it("should NOT generate a soft redirect to the locale (with i18n)", () => {
        globalThis.mockConstants = {
          ...getConstants(),
          ROOT_DIR,
          IS_STATIC_EXPORT: false,
          BUILD_DIR: ROOT_DIR,
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
          getPathname("en", "user", "testUserName.html"),
          getPathname("pt", "usuario", "testUserName.html"),
        ]);
      });

      it('should NOT move assets neither client code inside the "out" folder', () => {
        const constants = getConstants();
        globalThis.mockConstants = {
          ...constants,
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          IS_STATIC_EXPORT: false,
        };
        spyOn(fs, "cpSync").mockImplementationOnce(() => null);

        expect(generateStaticExport()).resolves.toEqual([
          getPathname("user", "testUserName.html"),
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
        };
        spyOn(console, "log").mockImplementation((...args) => mockLog(...args));

        expect(generateStaticExport()).resolves.toEqual([
          getPathname("en", "user", "testUserName.html"),
          getPathname("pt", "user", "testUserName.html"),
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
        };
        const mockLog = spyOn(console, "log").mockImplementation(() => null);

        expect(generateStaticExport()).resolves.toEqual([
          getPathname("user", "testUserName.html"),
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
        };
        const constants = getConstants();
        mockFetch.mockImplementation(() => new Response(constants.SCRIPT_404));

        expect(generateStaticExport()).resolves.toBeEmpty();
      });

      it("should prerender dynamic routes without i18n and without trailingSlash", () => {
        mockConstants = {
          ...getConstants(),
          ROOT_DIR,
          BUILD_DIR: ROOT_DIR,
          IS_STATIC_EXPORT: false,
        };

        expect(generateStaticExport()).resolves.toEqual([
          getPathname("user", "testUserName.html"),
        ]);

        expect(mockWrite.mock.calls[0][0]).toStartWith(
          path.join(ROOT_DIR, "build", "prerendered-pages"),
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
          },
          IS_STATIC_EXPORT: false,
        };

        expect(generateStaticExport()).resolves.toEqual([
          getPathname("user", "testUserName", "index.html"),
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
        };

        expect(generateStaticExport()).resolves.toEqual([
          "/user.html",
          "/user2.html",
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
        };

        expect(generateStaticExport()).resolves.toEqual([
          "/foo.html",
          "/bar.html",
          "/baz.html",
          "/foo/user.html",
          "/bar/user.html",
          "/baz/user.html",
          "/foo/user2.html",
          "/bar/user2.html",
          "/baz/user2.html",
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
        };

        expect(generateStaticExport()).resolves.toEqual([
          "/foo/bar/baz.html",
          "/foo/bar/baz/qux.html",
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
        };

        expect(generateStaticExport()).resolves.toEqual([
          "/a/b/c.html",
          "/a/b.html",
          "/a.html",
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
        };

        expect(generateStaticExport()).resolves.toEqual(["/b.html"]);
      });
    });
  });
});
