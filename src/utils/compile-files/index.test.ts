import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import compileFiles from ".";
import getConstants from "@/constants";

const originalConsoleLog = console.log;
const DIR = import.meta.dir;

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
  describe("compileFiles DEVELOPMENT", () => {
    afterEach(() => {
      console.log = originalConsoleLog;
      globalThis.mockConstants = undefined;

      if (fs.existsSync(DEV_BUILD_DIR)) {
        fs.rmSync(DEV_BUILD_DIR, { recursive: true });
      }

      if (fs.existsSync(BUILD_DIR)) {
        fs.rmSync(BUILD_DIR, { recursive: true });
      }
    });
    it("should compile fixtures routes correctly", async () => {
      console.log = mock((v) => v);
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        PAGES_DIR: DEV_PAGES_DIR,
        BUILD_DIR: DEV_BUILD_DIR,
        IS_PRODUCTION: false,
        SRC_DIR: DEV_SRC_DIR,
        ASSETS_DIR: DEV_ASSETS_DIR,
      };

      const { success, logs } = await compileFiles();
      const files = fs.readdirSync(DEV_BUILD_DIR).toSorted();
      const brisaInternals = fs.readdirSync(path.join(DEV_BUILD_DIR, "_brisa"));

      expect(logs).toEqual([]);
      expect(success).toBe(true);
      expect(console.log).toHaveBeenCalledTimes(0);
      expect(files).toHaveLength(3);
      expect(files[0]).toBe("_brisa");
      expect(files[1]).toBe("pages");
      expect(files[2]).toBe("pages-client");
      expect(brisaInternals).toEqual(["types.ts"]);
    });
  });

  describe("compileFiles PRODUCTION", () => {
    it("should compile fixtures routes correctly", async () => {
      const mockLog = spyOn(console, "log");
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

      mockLog.mockImplementation(() => {});

      const { success, logs } = await compileFiles();

      expect(logs).toEqual([]);
      expect(success).toBe(true);

      const files = fs.readdirSync(BUILD_DIR).toSorted();

      expect(fs.existsSync(TYPES)).toBe(true);
      expect(minifyText(fs.readFileSync(TYPES).toString())).toBe(
        minifyText(`
          export interface IntrinsicCustomElements {
            'native-some-example': JSX.WebComponentAttributes<typeof import("${SRC_DIR}/web-components/@-native/some-example.tsx").default>;
            'web-component': JSX.WebComponentAttributes<typeof import("${SRC_DIR}/web-components/web/component.tsx").default>;
            'with-context': JSX.WebComponentAttributes<typeof import("${SRC_DIR}/web-components/with-context.tsx").default>;
          }`),
      );
      expect(console.log).toHaveBeenCalled();
      expect(files).toHaveLength(10);
      expect(files[0]).toBe("_brisa");
      expect(files[1]).toBe("api");
      expect(files[2]).toStartWith("chunk-");
      expect(files[3]).toStartWith("chunk-");
      expect(files[4]).toBe("i18n.js");
      expect(files[5]).toBe("layout.js");
      expect(files[6]).toBe("middleware.js");
      expect(files[7]).toBe("pages");
      expect(files[8]).toBe("pages-client");
      expect(files[9]).toBe("websocket.js");

      const info = constants.LOG_PREFIX.INFO;
      const chunkHash = files[2].replace("chunk-", "").replace(".js", "");
      const anotherChunkHash = files[3]
        .replace("chunk-", "")
        .replace(".js", "");
      const logOutput = minifyText(mockLog.mock.calls.flat().join("\n"));
      mockLog.mockRestore();

      const expected = minifyText(`
    ${info}
    ${info}Route                               | Size | Client size  
    ${info}------------------------------------------------------------
    ${info}λ /pages/_404.js                    | 421 B | 6 kB 
    ${info}λ /pages/_500.js                    | 427 B | 6 kB 
    ${info}λ /pages/page-with-web-component.js | 360 B | 6 kB
    ${info}λ /pages/somepage.js                | 341 B | 0 B
    ${info}λ /pages/somepage-with-context.js   | 327 B | 0 B
    ${info}λ /pages/index.js                   | 267 B | 217 B 
    ${info}λ /pages/user/[username].js         | 175 B | 0 B 
    ${info}ƒ /middleware.js                    | 412 B | 0 B
    ${info}λ /api/example.js                   | 275 B | 0 B 
    ${info}Δ /layout.js                        | 342 B | 0 B
    ${info}Ω /i18n.js                          | 154 B | 0 B
    ${info}Ψ /websocket.js                     | 199 B | 0 B
    ${info}Φ /chunk-${chunkHash}.js        | 2 kB  | 0 B
    ${info}Φ /chunk-${anotherChunkHash}.js       | 66 B  | 0 B
    ${info}
    ${info}λ Server entry-points
    ${info}Δ Layout
    ${info}ƒ Middleware
    ${info}Ω i18n
    ${info}Ψ Websocket
    ${info}Φ JS shared by all
    ${info}
  `);
      expect(logOutput).toContain(expected);
    });
  });
});
