import { describe, it, expect, spyOn } from "bun:test";
import AST from "@/utils/ast";
import replaceAstImportsToAbsolute from ".";
import { normalizeQuotes } from "@/helpers";
import constants from "@/constants";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const { SRC_DIR } = constants;

describe("utils", () => {
  describe("replace-ast-imports-to-absolute", () => {
    it("should transform relative imports to absolute", async () => {
      const code = `
        import createPortal from "@/utils/create-portal";
        import dangerHTML from "@/utils/danger-html";
        import createContext from "@/utils/create-context";
        import notFound from "@/utils/not-found";
        import translateCore from "@/utils/translate-core";
        
        export {createPortal, dangerHTML, createContext, notFound, translateCore};
      `;

      const ast = parseCodeToAST(code);
      const modifiedAst = await replaceAstImportsToAbsolute(
        ast,
        import.meta.url,
      );
      const result = normalizeQuotes(generateCodeFromAST(modifiedAst));
      const expected = normalizeQuotes(`
        import createPortal from "${SRC_DIR}/utils/create-portal/index.ts";
        import dangerHTML from "${SRC_DIR}/utils/danger-html/index.ts";
        import createContext from "${SRC_DIR}/utils/create-context/index.ts";
        import notFound from "${SRC_DIR}/utils/not-found/index.ts";
        import translateCore from "${SRC_DIR}/utils/translate-core/index.ts";
        
        export {createPortal, dangerHTML, createContext, notFound, translateCore};
      `);

      expect(result).toEqual(expected);
    });

    it('should transform relative "require" to absolute', async () => {
      const code = `
        const createPortal = require("@/utils/create-portal");
        const dangerHTML = require("@/utils/danger-html");
        const createContext = require("@/utils/create-context");
        const notFound = require("@/utils/not-found");
        const translateCore = require("@/utils/translate-core");
        
        module.exports = {createPortal,dangerHTML,createContext,notFound,translateCore};
      `;

      const ast = parseCodeToAST(code);
      const modifiedAst = await replaceAstImportsToAbsolute(
        ast,
        import.meta.url,
      );
      const result = normalizeQuotes(generateCodeFromAST(modifiedAst));
      const expected = normalizeQuotes(`
        const createPortal = require("${SRC_DIR}/utils/create-portal/index.ts");
        const dangerHTML = require("${SRC_DIR}/utils/danger-html/index.ts");
        const createContext = require("${SRC_DIR}/utils/create-context/index.ts");
        const notFound = require("${SRC_DIR}/utils/not-found/index.ts");
        const translateCore = require("${SRC_DIR}/utils/translate-core/index.ts");
        
        module.exports = {createPortal,dangerHTML,createContext,notFound,translateCore};
      `);

      expect(result).toEqual(expected);
    });

    it("should transform dynamic imports to absolute", async () => {
      const code = `
        import("@/utils/create-portal");
        import("@/utils/danger-html");
        import("@/utils/create-context");
        import("@/utils/not-found");
        import("@/utils/translate-core");
      `;

      const ast = parseCodeToAST(code);
      const modifiedAst = await replaceAstImportsToAbsolute(
        ast,
        import.meta.url,
      );
      const result = normalizeQuotes(generateCodeFromAST(modifiedAst));
      const expected = normalizeQuotes(`
        import("${SRC_DIR}/utils/create-portal/index.ts");
        import("${SRC_DIR}/utils/danger-html/index.ts");
        import("${SRC_DIR}/utils/create-context/index.ts");
        import("${SRC_DIR}/utils/not-found/index.ts");
        import("${SRC_DIR}/utils/translate-core/index.ts");
      `);

      expect(result).toEqual(expected);
    });

    it("should log an error when the path is not found", async () => {
      const mockLogError = spyOn(console, "log");
      const code = `
        import("@/foo/unknown");
      `;

      const ast = parseCodeToAST(code);
      const modifiedAst = await replaceAstImportsToAbsolute(
        ast,
        import.meta.url,
      );
      const result = normalizeQuotes(generateCodeFromAST(modifiedAst));
      const expected = normalizeQuotes(`
        import("@/foo/unknown");
      `);

      expect(mockLogError.mock.calls.toString()).toContain(
        "Error resolving import path:",
      );
      expect(mockLogError.mock.calls.toString()).toContain(
        `Cannot find module "@/foo/unknown" from "file://${SRC_DIR}/utils/replace-ast-imports-to-absolute/index.test.ts`,
      );
      expect(result).toEqual(expected);
      mockLogError.mockRestore();
    });
  });
});
