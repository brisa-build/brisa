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

const ROOT_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const mockFetch = mock((request: Request) => new Response(""));
const mockWrite = mock(async (...args: any[]) => 0);
let spyWrite;

const testFetchIndex = (index: number, pathname: string) => {
  expect(mockFetch.mock.calls[index][0].url).toBe(
    new URL(pathname, "http://localhost").toString(),
  );
};

const testGeneratedPathnamesByIndex = (
  index: number,
  ...pathnames: string[]
) => {
  expect(mockWrite.mock.calls[index][0]).toBe(
    path.join(ROOT_DIR, "out", ...pathnames),
  );
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
      };
    });

    afterEach(() => {
      mockFetch.mockRestore();
      mockWrite.mockRestore();
      spyWrite!.mockRestore();
      globalThis.mockConstants = undefined;
      mock.restore();
    });

    it("should generate static export without i18n and without trailingSlash", () => {
      expect(generateStaticExport()).resolves.toBeTrue();

      // Fetch to generate static export
      expect(mockFetch).toHaveBeenCalledTimes(7);
      testFetchIndex(0, "/_404");
      testFetchIndex(1, "/_500");
      testFetchIndex(2, "/page-with-web-component");
      testFetchIndex(3, "/somepage");
      testFetchIndex(4, "/somepage-with-context");
      testFetchIndex(5, "/");
      testFetchIndex(6, "/user/[username]");

      // Write to generate static export
      expect(mockWrite).toHaveBeenCalledTimes(7);
      testGeneratedPathnamesByIndex(0, "_404.html");
      testGeneratedPathnamesByIndex(1, "_500.html");
      testGeneratedPathnamesByIndex(2, "page-with-web-component.html");
      testGeneratedPathnamesByIndex(3, "somepage.html");
      testGeneratedPathnamesByIndex(4, "somepage-with-context.html");
      testGeneratedPathnamesByIndex(5, "index.html");
      testGeneratedPathnamesByIndex(6, "user", "[username].html");
    });

    it("should generate static export with i18n with a soft redirect to the locale", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        ROOT_DIR,
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

      expect(generateStaticExport()).resolves.toBeTrue();

      // Fetch to generate static export
      expect(mockFetch).toHaveBeenCalledTimes(14);
      testFetchIndex(0, "/en/_404");
      testFetchIndex(1, "/pt/_404");
      testFetchIndex(2, "/en/_500");
      testFetchIndex(3, "/pt/_500");
      testFetchIndex(4, "/en/page-with-web-component");
      testFetchIndex(5, "/pt/pagina-com-web-component");
      testFetchIndex(6, "/en/somepage");
      testFetchIndex(7, "/pt/alguma-pagina");
      testFetchIndex(8, "/en/somepage-with-context");
      testFetchIndex(9, "/pt/alguma-pagina-com-contexto");
      testFetchIndex(10, "/en");
      testFetchIndex(11, "/pt");
      testFetchIndex(12, "/en/user/[username]");
      testFetchIndex(13, "/pt/usuario/[username]");

      // Write to generate static export
      expect(mockWrite).toHaveBeenCalledTimes(15);
      testGeneratedPathnamesByIndex(0, "en", "_404.html");
      testGeneratedPathnamesByIndex(1, "pt", "_404.html");
      testGeneratedPathnamesByIndex(2, "en", "_500.html");
      testGeneratedPathnamesByIndex(3, "pt", "_500.html");
      testGeneratedPathnamesByIndex(4, "en", "page-with-web-component.html");
      testGeneratedPathnamesByIndex(5, "pt", "pagina-com-web-component.html");
      testGeneratedPathnamesByIndex(6, "en", "somepage.html");
      testGeneratedPathnamesByIndex(7, "pt", "alguma-pagina.html");
      testGeneratedPathnamesByIndex(8, "en", "somepage-with-context.html");
      testGeneratedPathnamesByIndex(9, "pt", "alguma-pagina-com-contexto.html");
      testGeneratedPathnamesByIndex(10, "en.html");
      testGeneratedPathnamesByIndex(11, "pt.html");
      testGeneratedPathnamesByIndex(12, "en", "user", "[username].html");
      testGeneratedPathnamesByIndex(13, "pt", "usuario", "[username].html");
      testGeneratedPathnamesByIndex(14, "index.html"); // Soft redirect to default locale

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
      };

      expect(generateStaticExport()).resolves.toBeTrue();

      // Fetch to generate static export
      expect(mockFetch).toHaveBeenCalledTimes(7);
      testFetchIndex(0, "/_404/");
      testFetchIndex(1, "/_500/");
      testFetchIndex(2, "/page-with-web-component/");
      testFetchIndex(3, "/somepage/");
      testFetchIndex(4, "/somepage-with-context/");
      testFetchIndex(5, "/");
      testFetchIndex(6, "/user/[username]/");

      // Write to generate static export
      expect(mockWrite).toHaveBeenCalledTimes(7);
      testGeneratedPathnamesByIndex(0, "_404", "index.html");
      testGeneratedPathnamesByIndex(1, "_500", "index.html");
      testGeneratedPathnamesByIndex(2, "page-with-web-component", "index.html");
      testGeneratedPathnamesByIndex(3, "somepage", "index.html");
      testGeneratedPathnamesByIndex(4, "somepage-with-context", "index.html");
      testGeneratedPathnamesByIndex(5, "index.html");
      testGeneratedPathnamesByIndex(6, "user", "[username]", "index.html");
    });

    it('should move all the assets inside the "out" folder', () => {
      spyOn(fs, "cpSync").mockImplementationOnce(() => null);

      expect(generateStaticExport()).resolves.toBeTrue();

      expect(fs.cpSync).toHaveBeenCalledTimes(2);
      expect(fs.cpSync).toHaveBeenCalledWith(
        path.join(ROOT_DIR, "public"),
        path.join(ROOT_DIR, "out"),
        { recursive: true },
      );
    });

    it("should move all JS client code files inside _brisa/pages folder", () => {
      spyOn(fs, "cpSync").mockImplementationOnce(() => null);

      expect(generateStaticExport()).resolves.toBeTrue();

      expect(fs.cpSync).toHaveBeenCalledTimes(2);
      expect(fs.cpSync).toHaveBeenCalledWith(
        path.join(ROOT_DIR, "pages-client"),
        path.join(ROOT_DIR, "out", "_brisa", "pages"),
        { recursive: true },
      );
    });

    it('should warn about redirect when "i18n" is defined', () => {
      const mockLog = mock((...args: any[]) => null);
      globalThis.mockConstants = {
        ...getConstants(),
        ROOT_DIR,
        BUILD_DIR: ROOT_DIR,
        I18N_CONFIG: {
          locales: ["en", "pt"],
          defaultLocale: "en",
        },
      };
      spyOn(console, "log").mockImplementation((...args) => mockLog(...args));

      expect(generateStaticExport()).resolves.toBeTrue();

      const logs = mockLog.mock.calls.flat().toString();
      const expectedTitle =
        "Unable to generate a hard redirect to the user browser language.";
      const expectedDocs =
        "https://brisa.build/building-your-application/deploying/static-exports#hard-redirects";
      expect(logs).toContain("Ops! Warning:");
      expect(logs).toContain(expectedTitle);
      expect(logs).toContain(expectedDocs);
    });

    it('should not warn about redirect when "i18n" is not defined', () => {
      spyOn(console, "log").mockImplementation(() => null);

      expect(generateStaticExport()).resolves.toBeTrue();

      expect(console.log).not.toHaveBeenCalled();
    });

    it("should not generate a page that during the streaming returns the soft redirect to 404 (notFound method)", () => {
      const constants = getConstants();
      mockFetch.mockImplementation(() => new Response(constants.SCRIPT_404));

      expect(generateStaticExport()).resolves.toBeTrue();

      expect(mockWrite).not.toHaveBeenCalled();
    });
  });
});
