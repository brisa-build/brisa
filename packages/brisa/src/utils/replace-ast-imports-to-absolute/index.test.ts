import { describe, it, expect, spyOn } from 'bun:test';
import AST from '@/utils/ast';
import { join } from 'node:path';
import replaceAstImportsToAbsolute from '.';
import { normalizeHTML } from '@/helpers';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');
const utilsDir = join(import.meta.dir, '..');

describe('utils', () => {
  describe('replace-ast-imports-to-absolute', () => {
    it('should not transform "brisa" and "brisa/server" imports', async () => {
      const code = `
        import {dangerHTML} from 'brisa';
        import {__prerender__macro, __resolveImportSync} from 'brisa/server' with { type: "macro" };
        import dangerHTML from "@/utils/danger-html";
      `;

      const ast = parseCodeToAST(code);
      const modifiedAst = await replaceAstImportsToAbsolute(
        ast,
        import.meta.url,
      );
      const result = normalizeHTML(generateCodeFromAST(modifiedAst));
      // macro is removed after the transpilation
      const expected = normalizeHTML(`
        import {dangerHTML} from 'brisa';
        import dangerHTML from "${utilsDir}/danger-html/index.ts";
      `);

      expect(result).toEqual(expected);
    });
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
      const modifiedAst = await replaceAstImportsToAbsolute(
        ast,
        import.meta.url,
      );
      const result = normalizeHTML(generateCodeFromAST(modifiedAst));
      const expected = normalizeHTML(`
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
      const modifiedAst = await replaceAstImportsToAbsolute(
        ast,
        import.meta.url,
      );
      const result = normalizeHTML(generateCodeFromAST(modifiedAst));
      const expected = normalizeHTML(`
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
      const modifiedAst = await replaceAstImportsToAbsolute(
        ast,
        import.meta.url,
      );
      const result = normalizeHTML(generateCodeFromAST(modifiedAst));
      const expected = normalizeHTML(`
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
      const modifiedAst = await replaceAstImportsToAbsolute(
        ast,
        import.meta.url,
      );
      const result = normalizeHTML(generateCodeFromAST(modifiedAst));
      const expected = normalizeHTML(`
        import("@/foo/unknown");
      `);

      expect(mockLogError.mock.calls.toString()).toContain(
        'Error resolving import path:',
      );
      expect(mockLogError.mock.calls.toString()).toContain(
        `Cannot find module "@/foo/unknown" from "file://${utilsDir}/replace-ast-imports-to-absolute`,
      );
      expect(result).toEqual(expected);
      mockLogError.mockRestore();
    });
  });
});
