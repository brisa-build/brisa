import {
  afterEach,
  describe,
  expect,
  it,
  spyOn,
  beforeEach,
  type Mock,
} from "bun:test";
import fs from "node:fs";
import path from "node:path";
import compileFiles from ".";
import { getConstants } from "@/constants";
import { toInline } from "@/helpers";
import { greenLog } from "@/utils/log/log-color";

const DIR = import.meta.dir;
const HASH = 123456;
const FIXTURES = path.join(DIR, "__fixtures__");
let mockHash: Mock<(val: any) => any>;
let mockConsoleLog: Mock<typeof console.log>;

function minifyText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

describe("utils", () => {
  beforeEach(() => {
    mockHash = spyOn(Bun, "hash").mockReturnValue(HASH);
    mockConsoleLog = spyOn(console, "log");
  });
  afterEach(() => {
    mockHash.mockRestore();
    mockConsoleLog.mockRestore();
    globalThis.mockConstants = undefined;
  });
  describe("compileFiles DEVELOPMENT", () => {
    afterEach(() => {
      globalThis.mockConstants = undefined;
    });
    it("should compile fixtures routes correctly", async () => {
      const DEV_SRC_DIR = path.join(FIXTURES, "with-dev-environment");
      const DEV_BUILD_DIR = path.join(DEV_SRC_DIR, "out");
      const DEV_PAGES_DIR = path.join(DEV_BUILD_DIR, "pages");
      const DEV_ASSETS_DIR = path.join(DEV_BUILD_DIR, "public");
      const constants = getConstants();

      globalThis.mockConstants = {
        ...constants,
        PAGES_DIR: DEV_PAGES_DIR,
        BUILD_DIR: DEV_BUILD_DIR,
        IS_PRODUCTION: false,
        SRC_DIR: DEV_SRC_DIR,
        ASSETS_DIR: DEV_ASSETS_DIR,
      };

      const { success, logs } = await compileFiles();
      const files = fs
        .readdirSync(DEV_BUILD_DIR)
        .toSorted((a, b) => a.localeCompare(b));
      const brisaInternals = fs.readdirSync(path.join(DEV_BUILD_DIR, "_brisa"));

      expect(logs).toBeEmpty();
      expect(success).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledTimes(0);
      expect(files).toHaveLength(3);
      expect(files[0]).toBe("_brisa");
      expect(files[1]).toBe("pages");
      expect(files[2]).toBe("pages-client");
      expect(brisaInternals).toEqual(["types.ts"]);
    });
  });

  describe("compileFiles PRODUCTION", () => {
    it("should compile fixtures routes correctly", async () => {
      const SRC_DIR = path.join(FIXTURES, "with-complex-files");
      const BUILD_DIR = path.join(SRC_DIR, "out");
      const PAGES_DIR = path.join(BUILD_DIR, "pages");
      const ASSETS_DIR = path.join(BUILD_DIR, "public");
      const TYPES = path.join(BUILD_DIR, "_brisa", "types.ts");
      const pagesClientPath = path.join(BUILD_DIR, "pages-client");
      const constants = getConstants();
      globalThis.mockConstants = {
        ...constants,
        PAGES_DIR,
        BUILD_DIR,
        IS_PRODUCTION: true,
        IS_DEVELOPMENT: false,
        SRC_DIR,
        ASSETS_DIR,
        I18N_CONFIG: {
          defaultLocale: "en",
          locales: ["en", "pt"],
          messages: {
            en: {
              hello: "Hello {{name}}",
              "some-key": "Some value",
            },
            pt: {
              hello: "Olá {{name}}",
              "some-key": "Algum valor",
            },
          },
        },
      };

      mockConsoleLog.mockImplementation(() => {});

      const { success, logs } = await compileFiles();

      expect(logs).toBeEmpty();
      expect(success).toBe(true);

      const files = fs
        .readdirSync(BUILD_DIR)
        .toSorted((a, b) => a.localeCompare(b));

      expect(fs.existsSync(TYPES)).toBe(true);
      expect(minifyText(fs.readFileSync(TYPES).toString())).toBe(
        minifyText(`
          export interface IntrinsicCustomElements {
            'native-some-example': JSX.WebComponentAttributes<typeof import("${SRC_DIR}/web-components/_native/some-example.tsx").default>;
            'web-component': JSX.WebComponentAttributes<typeof import("${SRC_DIR}/web-components/web/component.tsx").default>;
            'with-context': JSX.WebComponentAttributes<typeof import("${SRC_DIR}/web-components/with-context.tsx").default>;
            'foo-component': JSX.WebComponentAttributes<typeof import("${SRC_DIR}/lib/foo.tsx").default>;
          }`),
      );
      expect(mockConsoleLog).toHaveBeenCalled();
      expect(files).toHaveLength(12);
      expect(files[0]).toBe("_brisa");
      expect(files[1]).toBe("actions");
      expect(files[2]).toBe("api");
      expect(files[3]).toStartWith("chunk-");
      expect(files[4]).toStartWith("chunk-");
      expect(files[5]).toBe("i18n.js");
      expect(files[6]).toBe("layout.js");
      expect(files[7]).toBe("middleware.js");
      expect(files[8]).toBe("pages");
      expect(files[9]).toBe("pages-client");
      expect(files[10]).toBe("web-components");
      expect(files[11]).toBe("websocket.js");

      // Test actions
      const homePageContent = await Bun.file(
        path.join(PAGES_DIR, "index.js"),
      ).text();

      expect(homePageContent).toContain(
        `"data-action-onclick":"a1_1","data-action"`,
      );
      expect(homePageContent).toContain(
        `"data-action-onclick":"a1_2","data-action"`,
      );

      const pagesClient = fs
        .readdirSync(pagesClientPath)
        .toSorted((a, b) => a.localeCompare(b));

      expect(pagesClient).toEqual([
        `_404-${HASH}-en.js`,
        `_404-${HASH}-en.js.gz`,
        `_404-${HASH}-pt.js`,
        `_404-${HASH}-pt.js.gz`,
        `_404-${HASH}.js`,
        `_404-${HASH}.js.gz`,
        `_404.txt`,
        `_500-${HASH}-en.js`,
        `_500-${HASH}-en.js.gz`,
        `_500-${HASH}-pt.js`,
        `_500-${HASH}-pt.js.gz`,
        `_500-${HASH}.js`,
        `_500-${HASH}.js.gz`,
        `_500.txt`,
        `_rpc-${constants.VERSION_HASH}.js`,
        `_rpc-${constants.VERSION_HASH}.js.gz`,
        `_rpc-lazy-${constants.VERSION_HASH}.js`,
        `_rpc-lazy-${constants.VERSION_HASH}.js.gz`,
        `_rpc.txt`,
        `_unsuspense-${constants.VERSION_HASH}.js`,
        `_unsuspense-${constants.VERSION_HASH}.js.gz`,
        `_unsuspense.txt`,
        `page-with-web-component-${HASH}-en.js`,
        `page-with-web-component-${HASH}-en.js.gz`,
        `page-with-web-component-${HASH}-pt.js`,
        `page-with-web-component-${HASH}-pt.js.gz`,
        `page-with-web-component-${HASH}.js`,
        `page-with-web-component-${HASH}.js.gz`,
        `page-with-web-component.txt`,
      ]);

      // Check i18n content depending the locale
      expect(
        await Bun.file(path.join(pagesClientPath, `_404-${HASH}-en.js`)).text(),
      ).toBe(
        toInline(`
          window.i18nMessages={"hello":"Hello {{name}}"};
      `),
      );

      expect(
        await Bun.file(path.join(pagesClientPath, `_404-${HASH}-pt.js`)).text(),
      ).toBe(
        toInline(`
          window.i18nMessages={"hello":"Olá {{name}}"};
      `),
      );

      const info = constants.LOG_PREFIX.INFO;

      const logOutput = minifyText(
        mockConsoleLog.mock.calls
          .flat()
          .join("\n")
          .replace(/chunk-\S*/g, "chunk-hash"),
      );

      const expected = minifyText(`
    ${info}
    ${info}Route                            | JS server | JS client (gz)  
    ${info}----------------------------------------------------------------
    ${info}λ /pages/_404                    | 470 B     | ${greenLog("4 kB")} 
    ${info}λ /pages/_500                    | 476 B     | ${greenLog("4 kB")} 
    ${info}λ /pages/page-with-web-component | 409 B     | ${greenLog("4 kB")} 
    ${info}λ /pages/somepage                | 396 B     | ${greenLog("0 B")} 
    ${info}λ /pages/somepage-with-context   | 324 B     | ${greenLog("0 B")} 
    ${info}λ /pages/index                   | 550 B     | ${greenLog("2 kB")}  
    ${info}λ /pages/user/[username]         | 183 B     | ${greenLog("0 B")}
    ${info}ƒ /middleware                    | 738 B     |
    ${info}λ /api/example                   | 283 B     |
    ${info}Δ /layout                        | 350 B     |
    ${info}Ω /i18n                          | 162 B     |
    ${info}Ψ /websocket                     | 207 B     |
    ${info}Θ /web-components/_integrations  | 103 B     |
    ${info}Φ /chunk-hash                    | 233 B     |
    ${info}
    ${info}λ Server entry-points
    ${info}Δ Layout
    ${info}ƒ Middleware
    ${info}Ω i18n
    ${info}Ψ Websocket
    ${info}Θ Web components integrations
    ${info}  - client code already included in each page
    ${info}  - server code is used for SSR
    ${info}
    ${info}Φ JS shared by all
    ${info}
  `);
      expect(logOutput).toContain(expected);
    });

    it("should compile an app with a web component in the layout and not in the page", async () => {
      const SRC_DIR = path.join(FIXTURES, "with-web-component-in-layout");
      const BUILD_DIR = path.join(SRC_DIR, "out");
      const PAGES_DIR = path.join(BUILD_DIR, "pages");
      const ASSETS_DIR = path.join(BUILD_DIR, "public");
      const TYPES = path.join(BUILD_DIR, "_brisa", "types.ts");
      const pagesClientPath = path.join(BUILD_DIR, "pages-client");
      const constants = getConstants();
      globalThis.mockConstants = {
        ...constants,
        PAGES_DIR,
        BUILD_DIR,
        IS_PRODUCTION: true,
        IS_DEVELOPMENT: false,
        SRC_DIR,
        ASSETS_DIR,
      };

      mockConsoleLog.mockImplementation(() => {});

      const { success, logs } = await compileFiles();

      expect(logs).toBeEmpty();
      expect(success).toBe(true);

      const files = fs
        .readdirSync(BUILD_DIR)
        .toSorted((a, b) => a.localeCompare(b));

      expect(fs.existsSync(TYPES)).toBe(true);
      expect(minifyText(fs.readFileSync(TYPES).toString())).toBe(
        minifyText(`
          export interface IntrinsicCustomElements {
            'layout-web-component': JSX.WebComponentAttributes<typeof import("${SRC_DIR}/web-components/layout-web-component.tsx").default>;
          }`),
      );
      expect(mockConsoleLog).toHaveBeenCalled();
      expect(files).toEqual(["_brisa", "layout.js", "pages", "pages-client"]);

      const pagesClient = fs
        .readdirSync(pagesClientPath)
        .toSorted((a, b) => a.localeCompare(b));

      expect(pagesClient).toEqual([
        `index-${HASH}.js`,
        `index-${HASH}.js.gz`,
        `index.txt`,
      ]);

      const info = constants.LOG_PREFIX.INFO;
      const logOutput = minifyText(
        mockConsoleLog.mock.calls
          .flat()
          .join("\n")
          .replace(/chunk-\S*/g, "chunk-hash"),
      );

      const expected = minifyText(`
    ${info}
    ${info}Route           | JS server | JS client (gz)  
    ${info}----------------------------------------------
    ${info}λ /pages/index  | 190 B     | ${greenLog("3 kB")}  
    ${info}Δ /layout       | 641 B     |
    ${info}
    ${info}λ Server entry-points
    ${info}Δ Layout
    ${info}Φ JS shared by all
    ${info}
  `);
      expect(logOutput).toContain(expected);
    });

    it("should compile an app with a server action in the layout and not in the page", async () => {
      const SRC_DIR = path.join(FIXTURES, "with-action-in-layout");
      const BUILD_DIR = path.join(SRC_DIR, "out");
      const PAGES_DIR = path.join(BUILD_DIR, "pages");
      const ASSETS_DIR = path.join(BUILD_DIR, "public");
      const TYPES = path.join(BUILD_DIR, "_brisa", "types.ts");
      const pagesClientPath = path.join(BUILD_DIR, "pages-client");
      const constants = getConstants();
      globalThis.mockConstants = {
        ...constants,
        PAGES_DIR,
        BUILD_DIR,
        IS_PRODUCTION: true,
        IS_DEVELOPMENT: false,
        SRC_DIR,
        ASSETS_DIR,
      };

      mockConsoleLog.mockImplementation(() => {});

      const { success, logs } = await compileFiles();

      expect(logs).toBeEmpty();
      expect(success).toBe(true);

      const files = fs
        .readdirSync(BUILD_DIR)
        .toSorted((a, b) => a.localeCompare(b));

      expect(fs.existsSync(TYPES)).toBe(true);
      expect(minifyText(fs.readFileSync(TYPES).toString())).toBe(
        minifyText(`export interface IntrinsicCustomElements { }`),
      );
      expect(mockConsoleLog).toHaveBeenCalled();
      expect(files).toEqual([
        "_brisa",
        "actions",
        "layout.js",
        "pages",
        "pages-client",
      ]);

      // Test actions
      const layoutContent = await Bun.file(
        path.join(BUILD_DIR, "layout.js"),
      ).text();

      expect(layoutContent).toContain(
        `"data-action-onclick":"a1_1","data-action"`,
      );

      const pagesClient = fs
        .readdirSync(pagesClientPath)
        .toSorted((a, b) => a.localeCompare(b));

      expect(pagesClient).toEqual([
        `_rpc-${constants.VERSION_HASH}.js`,
        `_rpc-${constants.VERSION_HASH}.js.gz`,
        `_rpc-lazy-${constants.VERSION_HASH}.js`,
        `_rpc-lazy-${constants.VERSION_HASH}.js.gz`,
        `_rpc.txt`,
      ]);

      const info = constants.LOG_PREFIX.INFO;

      const logOutput = minifyText(
        mockConsoleLog.mock.calls
          .flat()
          .join("\n")
          .replace(/chunk-\S*/g, "chunk-hash"),
      );

      const expected = minifyText(`
    ${info}
    ${info}Route           | JS server | JS client (gz)  
    ${info}----------------------------------------------
    ${info}λ /pages/index  | 190 B     | ${greenLog("2 kB")}  
    ${info}Δ /layout       | 435 B     |
    ${info}
    ${info}λ Server entry-points
    ${info}Δ Layout
    ${info}Φ JS shared by all
    ${info}
  `);
      expect(logOutput).toContain(expected);
    });

    it("should compile an app with a suspense in the layout and not in the page", async () => {
      const SRC_DIR = path.join(FIXTURES, "with-suspense-in-layout");
      const BUILD_DIR = path.join(SRC_DIR, "out");
      const PAGES_DIR = path.join(BUILD_DIR, "pages");
      const ASSETS_DIR = path.join(BUILD_DIR, "public");
      const TYPES = path.join(BUILD_DIR, "_brisa", "types.ts");
      const pagesClientPath = path.join(BUILD_DIR, "pages-client");
      const constants = getConstants();
      globalThis.mockConstants = {
        ...constants,
        PAGES_DIR,
        BUILD_DIR,
        IS_PRODUCTION: true,
        IS_DEVELOPMENT: false,
        SRC_DIR,
        ASSETS_DIR,
      };

      mockConsoleLog.mockImplementation(() => {});

      const { success, logs } = await compileFiles();

      expect(logs).toBeEmpty();
      expect(success).toBe(true);

      const files = fs
        .readdirSync(BUILD_DIR)
        .toSorted((a, b) => a.localeCompare(b));

      expect(fs.existsSync(TYPES)).toBe(true);
      expect(minifyText(fs.readFileSync(TYPES).toString())).toBe(
        minifyText(`export interface IntrinsicCustomElements { }`),
      );
      expect(mockConsoleLog).toHaveBeenCalled();
      expect(files).toEqual(["_brisa", "layout.js", "pages", "pages-client"]);

      const pagesClient = fs
        .readdirSync(pagesClientPath)
        .toSorted((a, b) => a.localeCompare(b));

      expect(pagesClient).toEqual([
        `_unsuspense-${constants.VERSION_HASH}.js`,
        `_unsuspense-${constants.VERSION_HASH}.js.gz`,
        `_unsuspense.txt`,
      ]);

      const info = constants.LOG_PREFIX.INFO;

      const logOutput = minifyText(
        mockConsoleLog.mock.calls
          .flat()
          .join("\n")
          .replace(/chunk-\S*/g, "chunk-hash"),
      );

      const expected = minifyText(`
    ${info}
    ${info}Route           | JS server | JS client (gz)  
    ${info}----------------------------------------------
    ${info}λ /pages/index  | 190 B     | ${greenLog("186 B")}  
    ${info}Δ /layout       | 536 B     |
    ${info}
    ${info}λ Server entry-points
    ${info}Δ Layout
    ${info}Φ JS shared by all
    ${info}
  `);
      expect(logOutput).toContain(expected);
    });

    it("should compile an app with a i18n client keys in the layout and not in the page", async () => {
      const SRC_DIR = path.join(FIXTURES, "with-i18nkeys-in-layout");
      const BUILD_DIR = path.join(SRC_DIR, "out");
      const PAGES_DIR = path.join(BUILD_DIR, "pages");
      const ASSETS_DIR = path.join(BUILD_DIR, "public");
      const TYPES = path.join(BUILD_DIR, "_brisa", "types.ts");
      const pagesClientPath = path.join(BUILD_DIR, "pages-client");
      const constants = getConstants();
      globalThis.mockConstants = {
        ...constants,
        PAGES_DIR,
        BUILD_DIR,
        IS_PRODUCTION: true,
        IS_DEVELOPMENT: false,
        SRC_DIR,
        ASSETS_DIR,
        I18N_CONFIG: (await import(path.join(SRC_DIR, "i18n"))).default,
      };

      mockConsoleLog.mockImplementation(() => {});

      const { success, logs } = await compileFiles();
      const englishFile = Bun.file(
        path.join(pagesClientPath, `index-${HASH}-en.js`),
      );
      const frenchFile = Bun.file(
        path.join(pagesClientPath, `index-${HASH}-fr.js`),
      );

      expect(await englishFile.exists()).toBeTrue();
      expect(await frenchFile.exists()).toBeTrue();

      // Check i18n content depending the locale
      expect(await englishFile.text()).toBe(
        toInline(`
          window.i18nMessages={"client-key":"Hello client!"};
      `),
      );

      expect(await frenchFile.text()).toBe(
        toInline(`
          window.i18nMessages={"client-key":"Bonjour client !"};
      `),
      );

      expect(logs).toBeEmpty();
      expect(success).toBe(true);

      const files = fs
        .readdirSync(BUILD_DIR)
        .toSorted((a, b) => a.localeCompare(b));

      expect(fs.existsSync(TYPES)).toBe(true);
      expect(minifyText(fs.readFileSync(TYPES).toString())).toBe(
        minifyText(`export interface IntrinsicCustomElements { 
          'layout-web-component': JSX.WebComponentAttributes<typeof import("${SRC_DIR}/web-components/layout-web-component.tsx").default>;
         }`),
      );
      expect(mockConsoleLog).toHaveBeenCalled();
      expect(files).toEqual([
        "_brisa",
        "i18n.js",
        "layout.js",
        "pages",
        "pages-client",
      ]);

      const pagesClient = fs
        .readdirSync(pagesClientPath)
        .toSorted((a, b) => a.localeCompare(b));

      expect(pagesClient).toEqual([
        `index-${HASH}-en.js`,
        `index-${HASH}-en.js.gz`,
        `index-${HASH}-fr.js`,
        `index-${HASH}-fr.js.gz`,
        `index-${HASH}.js`,
        `index-${HASH}.js.gz`,
        `index.txt`,
      ]);

      const info = constants.LOG_PREFIX.INFO;

      const logOutput = minifyText(
        mockConsoleLog.mock.calls
          .flat()
          .join("\n")
          .replace(/chunk-\S*/g, "chunk-hash"),
      );

      const expected = minifyText(`
    ${info}
    ${info}Route           | JS server | JS client (gz)  
    ${info}----------------------------------------------
    ${info}λ /pages/index  | 190 B     | ${greenLog("4 kB")}  
    ${info}Δ /layout       | 674 B     |
    ${info}Ω /i18n         | 257 B     |
    ${info}
    ${info}λ Server entry-points
    ${info}Δ Layout
    ${info}Ω i18n
    ${info}Φ JS shared by all
    ${info}
  `);
      expect(logOutput).toContain(expected);
    });

    it("should compile an app with a context-provider in the layout and not in the page", async () => {
      const SRC_DIR = path.join(FIXTURES, "with-context-in-layout");
      const BUILD_DIR = path.join(SRC_DIR, "out");
      const PAGES_DIR = path.join(BUILD_DIR, "pages");
      const ASSETS_DIR = path.join(BUILD_DIR, "public");
      const pagesClientPath = path.join(BUILD_DIR, "pages-client");
      const constants = getConstants();
      globalThis.mockConstants = {
        ...constants,
        PAGES_DIR,
        BUILD_DIR,
        IS_PRODUCTION: true,
        IS_DEVELOPMENT: false,
        SRC_DIR,
        ASSETS_DIR,
      };

      mockConsoleLog.mockImplementation(() => {});

      const { success, logs } = await compileFiles();
      expect(logs).toBeEmpty();
      expect(success).toBe(true);

      const files = fs
        .readdirSync(BUILD_DIR)
        .toSorted((a, b) => a.localeCompare(b));

      expect(mockConsoleLog).toHaveBeenCalled();
      expect(files).toEqual(["_brisa", "layout.js", "pages", "pages-client"]);

      const pagesClient = fs
        .readdirSync(pagesClientPath)
        .toSorted((a, b) => a.localeCompare(b));

      expect(pagesClient).toEqual([
        `index-${HASH}.js`,
        `index-${HASH}.js.gz`,
        `index.txt`,
      ]);

      const codePage = await Bun.file(
        path.join(pagesClientPath, `index-${HASH}.js`),
      ).text();

      expect(codePage).toContain(`"context-provider"`);
      expect(codePage).toContain(`"cid"`); // context ID
      expect(codePage).toContain(`"pid"`); // provider ID

      const info = constants.LOG_PREFIX.INFO;

      const logOutput = minifyText(
        mockConsoleLog.mock.calls
          .flat()
          .join("\n")
          .replace(/chunk-\S*/g, "chunk-hash"),
      );

      const expected = minifyText(`
    ${info}
    ${info}Route           | JS server | JS client (gz)  
    ${info}----------------------------------------------
    ${info}λ /pages/index  | 190 B     | ${greenLog("3 kB")}  
    ${info}Δ /layout       | 868 B     |
    ${info}
    ${info}λ Server entry-points
    ${info}Δ Layout
    ${info}Φ JS shared by all
    ${info}
  `);
      expect(logOutput).toContain(expected);
    });
  });
});
