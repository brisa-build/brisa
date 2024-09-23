import { describe, it, beforeEach, expect } from 'bun:test';
import path from 'node:path';
import { normalizeHTML } from '../src/helpers';
import fs from 'node:fs';

const outFolder = path.join(import.meta.dirname, '..', 'compiler');
const outFile = path.join(outFolder, 'index.js');

// Skip in Windows for now for a Bug in Bun.build and absolute paths
// inside onResolve. TODO: Change it when this issue is fixed
// https://github.com/oven-sh/bun/issues/13897
describe.skipIf(process.platform === 'win32')(
  'scripts/core-compiler-build',
  () => {
    beforeEach(() => {
      if (fs.existsSync(outFile)) {
        fs.rmSync(outFolder, { force: true, recursive: true });
      }
    });

    it('should build the core compiler without server dependencies', async () => {
      const inputCode = `
      export default function Hello() {
        return 'Hello World';
      }
     `;
      const expectedCode = normalizeHTML(`import {brisaElement, _on, _off} from "brisa/client";
        function Hello() {
          return "Hello World";
        }
       export default brisaElement(Hello);
      `);
      await import('./core-compiler-build');
      expect(fs.existsSync(outFile)).toBeTrue();
      const compiledText = fs.readFileSync(outFile, 'utf-8');
      expect(compiledText).not.toContain('node:');
      const compiledCode = await import(outFile);
      expect(compiledCode.compileWC).toBeDefined();
      expect(normalizeHTML(compiledCode.compileWC(inputCode))).toBe(
        expectedCode,
      );
    });
  },
);
