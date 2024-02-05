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
let mockHash: Mock<(val: any) => any>;
let mockConsoleLog: Mock<typeof console.log>;

// Development
const DEV_SRC_DIR = path.join(DIR, "..", "..", "__fixtures__", "dev");
const DEV_BUILD_DIR = path.join(DEV_SRC_DIR, "out");
const DEV_PAGES_DIR = path.join(DEV_BUILD_DIR, "pages");
const DEV_ASSETS_DIR = path.join(DEV_BUILD_DIR, "public");

// Production
const SRC_DIR = path.join(DIR, "..", "..", "__fixtures__");
const BUILD_DIR = path.join(SRC_DIR, "out");
const PAGES_DIR = path.join(BUILD_DIR, "pages");
const ASSETS_DIR = path.join(BUILD_DIR, "public");
const TYPES = path.join(BUILD_DIR, "_brisa", "types.ts");

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

      if (fs.existsSync(DEV_BUILD_DIR)) {
        fs.rmSync(DEV_BUILD_DIR, { recursive: true });
      }

      if (fs.existsSync(BUILD_DIR)) {
        fs.rmSync(BUILD_DIR, { recursive: true });
      }
    });
    it("should compile fixtures routes correctly", async () => {
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

      expect(logs).toEqual([]);
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

      expect(logs).toEqual([]);
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
        `_action.js`,
        `_action.js.gz`,
        `_action.txt`,
        `_unsuspense.js`,
        `_unsuspense.js.gz`,
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
    ${info}λ /pages/_404                    | 429 B     | ${greenLog("4 kB")} 
    ${info}λ /pages/_500                    | 435 B     | ${greenLog("4 kB")} 
    ${info}λ /pages/page-with-web-component | 368 B     | ${greenLog("4 kB")} 
    ${info}λ /pages/somepage                | 349 B     | ${greenLog("0 B")} 
    ${info}λ /pages/somepage-with-context   | 335 B     | ${greenLog("0 B")} 
    ${info}λ /pages/index                   | 486 B     | ${greenLog("744 B")}  
    ${info}λ /pages/user/[username]         | 183 B     | ${greenLog("0 B")}
    ${info}ƒ /middleware                    | 420 B     |
    ${info}λ /api/example                   | 283 B     |
    ${info}Δ /layout                        | 350 B     |
    ${info}Ω /i18n                          | 162 B     |
    ${info}Ψ /websocket                     | 207 B     |
    ${info}Θ /web-components/_integrations  | 103 B     |
    ${info}Φ /chunk-hash                    | 3 kB      |
    ${info}Φ /chunk-hash                    | 106 B     |
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
  });
});
