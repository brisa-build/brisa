import path from "node:path";
import fs from "node:fs";
import { describe, it, expect, afterEach, mock } from "bun:test";
import compileFiles from ".";
import getConstants from "../../constants";

const originalConsoleLog = console.log;

function minifyText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

describe("utils", () => {
  describe("compileFiles", () => {
    afterEach(() => {
      console.log = originalConsoleLog;
      globalThis.mockConstants = undefined;
    });

    it("should compile fixtures routes correctly in DEVELOPMENT", async () => {
      const BUILD_DIR = path.join(
        import.meta.dir,
        "..",
        "..",
        "__fixtures__",
        "dev",
      );
      const PAGES_DIR = path.join(BUILD_DIR, "pages");
      const ASSETS_DIR = path.join(BUILD_DIR, "public");
      const OUT_DIR = path.join(BUILD_DIR, "out");

      console.log = mock((v) => v);
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        PAGES_DIR,
        BUILD_DIR,
        IS_PRODUCTION: false,
        SRC_DIR: BUILD_DIR,
        ASSETS_DIR,
      };

      const { success, logs } = await compileFiles(OUT_DIR);
      const files = fs.readdirSync(OUT_DIR);
      const brisaInternals = fs.readdirSync(path.join(OUT_DIR, "_brisa"));

      fs.rmSync(OUT_DIR, { recursive: true });
      expect(logs).toEqual([]);
      expect(success).toBe(true);
      expect(console.log).toHaveBeenCalledTimes(0);
      expect(files).toEqual([
        "pages-client",
        "_brisa",
        "pages",
        "chunk-e209715fdb13aa54.js",
      ]);

      expect(brisaInternals).toEqual(["types.ts"]);
    });
  });

  it("should compile fixtures routes correctly in PRODUCTION", async () => {
    const BUILD_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
    const PAGES_DIR = path.join(BUILD_DIR, "pages");
    const ASSETS_DIR = path.join(BUILD_DIR, "public");
    const OUT_DIR = path.join(BUILD_DIR, "out");
    const TYPES = path.join(OUT_DIR, "_brisa", "types.ts");

    console.log = mock((v) => v);
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      PAGES_DIR,
      BUILD_DIR,
      IS_PRODUCTION: true,
      SRC_DIR: BUILD_DIR,
      ASSETS_DIR,
    };

    const { success, logs } = await compileFiles(OUT_DIR);
    const files = fs.readdirSync(OUT_DIR);

    expect(fs.existsSync(TYPES)).toBe(true);
    expect(fs.readFileSync(TYPES).toString()).toBe(
      `export interface IntrinsicCustomElements {\n  'native-some-example': HTMLAttributes<typeof import("${BUILD_DIR}/web-components/@native/some-example.tsx")>;\n}`,
    );

    fs.rmSync(OUT_DIR, { recursive: true });
    expect(logs).toEqual([]);
    expect(success).toBe(true);
    expect(console.log).toHaveBeenCalled();
    expect(files).toEqual([
      "pages-client",
      "layout.js",
      "_brisa",
      "middleware.js",
      "api",
      "pages",
      "i18n.js",
      "chunk-e209715fdb13aa54.js",
    ]);
    const info = `[ \x1b[34minfo\x1b[0m ]  `;
    const logOutput = minifyText(
      (console.log as any).mock.calls.flat().join("\n"),
    );
    expect(logOutput).toBe(
      minifyText(`
        ${info}
        ${info}Route                               | Size | Client size  
        ${info}------------------------------------------------------------
        ${info}λ /pages/_404.js                    | 261 B | 0 B 
        ${info}λ /pages/page-with-web-component.js | 273 B | 621 B 
        ${info}λ /pages/somepage.js                | 151 B | 0 B
        ${info}λ /pages/index.js                   | 233 B | 0 B 
        ${info}λ /pages/user/[username].js         | 144 B | 0 B 
        ${info}λ /api/example.js                   | 275 B | 0 B 
        ${info}ƒ /middleware.js                    | 151 B | 0 B 
        ${info}Ω /i18n.js                          | 154 B | 0 B 
        ${info}Δ /layout.js                        | 307 B | 0 B
        ${info}Φ /chunk-e209715fdb13aa54.js        | 85 B  | 0 B
        ${info}
        ${info}λ Server entry-points
        ${info}Δ Layout
        ${info}ƒ Middleware
        ${info}Ω i18n
        ${info}Φ JS shared by all
        ${info}
      `),
    );
  });
});
