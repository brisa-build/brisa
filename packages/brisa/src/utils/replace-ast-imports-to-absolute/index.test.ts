import { describe, it, expect, spyOn } from 'bun:test';
import AST from '@/utils/ast';
import { join } from 'node:path';
import replaceAstImportsToAbsolute from '.';
import { normalizeQuotes } from '@/helpers';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');
const utilsDir = join(import.meta.dir, '..');

describe('utils', () => {
  describe('replace-ast-imports-to-absolute', () => {
    it('should transform relative imports to absolute', async () => {
      const code = `
        import createPortal from "@/utils/create-portal";
        import dangerHTML from "@/utils/danger-html";
        import createContext from "@/utils/create-context";
        import notFound from "@/utils/not-found";
        import translateCore from "@/utils/translate-core";
        
        export {createPortal, dangerHTML, createContext, notFound, translateCore};
      `;

      const ast = parseCodeToAST(code);
      const modifiedAst = await replaceAstImportsToAbsolute(ast, import.meta.url);
      const result = normalizeQuotes(generateCodeFromAST(modifiedAst));
      const expected = normalizeQuotes(`
        import createPortal from "${utilsDir}/create-portal/index.ts";
        import dangerHTML from "${utilsDir}/danger-html/index.ts";
        import createContext from "${utilsDir}/create-context/index.ts";
        import notFound from "${utilsDir}/not-found/index.ts";
        import translateCore from "${utilsDir}/translate-core/index.ts";
        
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
      const modifiedAst = await replaceAstImportsToAbsolute(ast, import.meta.url);
      const result = normalizeQuotes(generateCodeFromAST(modifiedAst));
      const expected = normalizeQuotes(`
        const createPortal = require("${utilsDir}/create-portal/index.ts");
        const dangerHTML = require("${utilsDir}/danger-html/index.ts");
        const createContext = require("${utilsDir}/create-context/index.ts");
        const notFound = require("${utilsDir}/not-found/index.ts");
        const translateCore = require("${utilsDir}/translate-core/index.ts");
        
        module.exports = {createPortal,dangerHTML,createContext,notFound,translateCore};
      `);

      expect(result).toEqual(expected);
    });

    it('should transform dynamic imports to absolute', async () => {
      const code = `
        import("@/utils/create-portal");
        import("@/utils/danger-html");
        import("@/utils/create-context");
        import("@/utils/not-found");
        import("@/utils/translate-core");
      `;

      const ast = parseCodeToAST(code);
      const modifiedAst = await replaceAstImportsToAbsolute(ast, import.meta.url);
      const result = normalizeQuotes(generateCodeFromAST(modifiedAst));
      const expected = normalizeQuotes(`
        import("${utilsDir}/create-portal/index.ts");
        import("${utilsDir}/danger-html/index.ts");
        import("${utilsDir}/create-context/index.ts");
        import("${utilsDir}/not-found/index.ts");
        import("${utilsDir}/translate-core/index.ts");
      `);

      expect(result).toEqual(expected);
    });

    it('should log an error when the path is not found', async () => {
      const mockLogError = spyOn(console, 'log');
      const code = `
        import("@/foo/unknown");
      `;

      const ast = parseCodeToAST(code);
      const modifiedAst = await replaceAstImportsToAbsolute(ast, import.meta.url);
      const result = normalizeQuotes(generateCodeFromAST(modifiedAst));
      const expected = normalizeQuotes(`
        import("@/foo/unknown");
      `);

      expect(mockLogError.mock.calls.toString()).toContain('Error resolving import path:');
      expect(mockLogError.mock.calls.toString()).toContain(
        `Cannot find module "@/foo/unknown" from "file://${utilsDir}/replace-ast-imports-to-absolute/index.test.ts`,
      );
      expect(result).toEqual(expected);
      mockLogError.mockRestore();
    });
  });
});
