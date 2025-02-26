import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import {
  preEntrypointAnalysis,
  rpcCode,
  RPCLazyCode,
  rpcStatic,
  unsuspenseScriptCode,
} from '.';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getConstants } from '@/constants';

const TEMP_DIR = path.join(import.meta.dirname, '.temp-test-files');

// Utility to create a unique file with Bun.hash
function createTempFileSync(content: string, extension = 'tsx') {
  const fileName = `${Bun.hash(content)}.${extension}`;
  const filePath = path.join(TEMP_DIR, fileName);
  return { filePath, content };
}

// Write files concurrently to disk
async function writeTempFiles(
  files: Array<{ filePath: string; content: string }>,
) {
  await Promise.all(
    files.map(({ filePath, content }) => writeFile(filePath, content, 'utf-8')),
  );
}

describe('client build', () => {
  describe('preEntrypointAnalysis', () => {
    beforeAll(async () => {
      await mkdir(TEMP_DIR, { recursive: true });
    });

    afterAll(async () => {
      await rm(TEMP_DIR, { recursive: true, force: true });
      globalThis.mockConstants = undefined;
    });

    it('should analyze the main file and detect no features', async () => {
      const mainFile = createTempFileSync(`
        export default function Component() {
          return <div>hello</div>;
        }
      `);
      await writeTempFiles([mainFile]);

      const result = await preEntrypointAnalysis(mainFile.filePath, {}, {});
      expect(result).toEqual({
        unsuspense: '',
        rpc: '',
        lazyRPC: '',
        size: 0,
        code: '',
        useI18n: false,
        i18nKeys: new Set(),
        pagePath: mainFile.filePath,
        webComponents: {},
        useContextProvider: false,
      });
    });

    it('should detect suspense in the main file', async () => {
      const mainFile = createTempFileSync(`
        export default function Component() {
          return <div>hello</div>;
        }

        Component.suspense = () => <div>loading...</div>;
      `);
      await writeTempFiles([mainFile]);

      const result = await preEntrypointAnalysis(mainFile.filePath, {}, {});
      expect(result).toEqual({
        unsuspense: unsuspenseScriptCode,
        rpc: '',
        lazyRPC: '',
        size: unsuspenseScriptCode.length,
        code: '',
        useI18n: false,
        i18nKeys: new Set(),
        pagePath: mainFile.filePath,
        webComponents: {},
        useContextProvider: false,
      });
    });

    it('should detect web components in the main file and nested components', async () => {
      const mainFile = createTempFileSync(`
        export default function Component() {
          return <nested-component>hello</nested-component>;
        }
      `);
      const nestedFile = createTempFileSync(`
        export default function NestedComponent() {
          return <divnested</div>;
        }
      `);

      await writeTempFiles([mainFile, nestedFile]);

      const allWebComponents = {
        'my-component': mainFile.filePath,
        'nested-component': nestedFile.filePath,
      };

      const entrypointWebComponents = {
        'my-component': mainFile.filePath,
      };

      const result = await preEntrypointAnalysis(
        mainFile.filePath,
        allWebComponents,
        entrypointWebComponents,
      );

      expect(result).toEqual({
        unsuspense: '',
        rpc: '',
        lazyRPC: '',
        size: 0,
        code: '',
        useI18n: false,
        i18nKeys: new Set(),
        pagePath: mainFile.filePath,
        useContextProvider: false,
        webComponents: {
          'my-component': mainFile.filePath,
          'nested-component': nestedFile.filePath,
        },
      });
    });

    it('should detect hyperlinks in the main file', async () => {
      const mainFile = createTempFileSync(`
        export default function Component() {
          return <a href="/relative">Relative Link</a>;
        }
      `);
      await writeTempFiles([mainFile]);

      const result = await preEntrypointAnalysis(mainFile.filePath, {}, {});
      expect(result).toEqual({
        unsuspense: '',
        rpc: rpcCode,
        lazyRPC: RPCLazyCode,
        size: rpcCode.length,
        code: '',
        useI18n: false,
        i18nKeys: new Set(),
        pagePath: mainFile.filePath,
        useContextProvider: false,
        webComponents: {},
      });
    });

    it('should detect hyperlinks in the main file and load static rpc for static app in prod', async () => {
      globalThis.mockConstants = {
        ...getConstants(),
        IS_STATIC_EXPORT: true,
        IS_PRODUCTION: true,
      };
      const mainFile = createTempFileSync(`
        export default function Component() {
          return <a href="/relative">Relative Link</a>;
        }
      `);
      await writeTempFiles([mainFile]);

      const result = await preEntrypointAnalysis(mainFile.filePath, {}, {});
      expect(result).toEqual({
        unsuspense: '',
        rpc: rpcStatic,
        lazyRPC: RPCLazyCode,
        size: rpcStatic.length,
        code: '',
        useI18n: false,
        i18nKeys: new Set(),
        pagePath: mainFile.filePath,
        useContextProvider: false,
        webComponents: {},
      });
    });

    it('should detect hyperlinks in the main file and load normal rpc for static app in dev', async () => {
      globalThis.mockConstants = {
        ...getConstants(),
        IS_STATIC_EXPORT: true,
        IS_PRODUCTION: false,
      };
      const mainFile = createTempFileSync(`
        export default function Component() {
          return <a href="/relative">Relative Link</a>;
        }
      `);
      await writeTempFiles([mainFile]);

      const result = await preEntrypointAnalysis(mainFile.filePath, {}, {});
      expect(result).toEqual({
        unsuspense: '',
        rpc: rpcCode,
        lazyRPC: RPCLazyCode,
        size: rpcCode.length,
        code: '',
        useI18n: false,
        i18nKeys: new Set(),
        pagePath: mainFile.filePath,
        useContextProvider: false,
        webComponents: {},
      });
    });

    it('should handle multiple nested components and aggregate metadata', async () => {
      const mainFile = createTempFileSync(`
        export default function Component() {
          return <nested-component-1>hello</nested-component-1>;
        }
      `);
      const nestedFile1 = createTempFileSync(`
        export default function NestedComponent1() {
          return <nested-component-2>nested 1</nested-component-2>;
        }
      `);
      const nestedFile2 = createTempFileSync(`
        export default function NestedComponent2() {
          return <nested-component-3>nested 2</nested-component-3>;
        }
      `);

      await writeTempFiles([mainFile, nestedFile1, nestedFile2]);

      const allWebComponents = {
        'nested-component-1': nestedFile1.filePath,
        'nested-component-2': nestedFile2.filePath,
        'nested-component-3': 'nested-component-3.js',
      };

      const entrypointWebComponents = {
        'nested-component-1': nestedFile1.filePath,
        'nested-component-2': nestedFile2.filePath,
      };

      const result = await preEntrypointAnalysis(
        mainFile.filePath,
        allWebComponents,
        entrypointWebComponents,
      );

      expect(result).toEqual({
        unsuspense: '',
        rpc: '',
        lazyRPC: '',
        size: 0,
        code: '',
        useI18n: false,
        i18nKeys: new Set(),
        pagePath: mainFile.filePath,
        useContextProvider: false,
        webComponents: {
          'nested-component-1': nestedFile1.filePath,
          'nested-component-2': nestedFile2.filePath,
          'nested-component-3': 'nested-component-3.js',
        },
      });
    });
  });
});
