import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { preEntrypointAnalysis } from '.';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const TEMP_DIR = path.join(import.meta.dirname, '.temp-test-files');

// Utility to create a unique file with Bun.hash
function createTempFileSync(content: string, extension = 'tsx') {
  const fileName = `${Bun.hash(content)}.${extension}`;
  const filePath = path.join(TEMP_DIR, fileName);
  return { filePath, content };
}

// Write files synchronously to disk
async function writeTempFiles(
  files: Array<{ filePath: string; content: string }>,
) {
  await Promise.all(
    files.map(({ filePath, content }) => writeFile(filePath, content, 'utf-8')),
  );
}

describe('utils', () => {
  describe('preEntrypointAnalysis', () => {
    beforeAll(async () => {
      await mkdir(TEMP_DIR, { recursive: true });
    });

    afterAll(async () => {
      await rm(TEMP_DIR, { recursive: true, force: true });
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
        useSuspense: false,
        useContextProvider: false,
        useActions: false,
        useHyperlink: false,
        webComponents: {},
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
        useSuspense: true,
        useContextProvider: false,
        useActions: false,
        useHyperlink: false,
        webComponents: {},
      });
    });

    it('should detect web components in the main file and nested components', async () => {
      const mainFile = createTempFileSync(`
        export default function Component() {
          return <nested-component><no-wc>hello</no-wc></nested-component>;
        }
      `);
      const nestedFile = createTempFileSync(`
        export default function NestedComponent() {
          return <nested-component>nested</nested-component>;
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
        useSuspense: false,
        useContextProvider: false,
        useActions: false,
        useHyperlink: false,
        webComponents: {
          'my-component': mainFile.filePath,
          'nested-component': nestedFile.filePath,
        },
      });
    });

    it('should handle context provider and actions', async () => {
      const mainFile = createTempFileSync(`
        export default function Component() {
          return <context-provider>hello</context-provider>;
        }
      `);
      await writeTempFiles([mainFile]);

      const result = await preEntrypointAnalysis(mainFile.filePath, {}, {});
      expect(result).toEqual({
        useSuspense: false,
        useContextProvider: true,
        useActions: false,
        useHyperlink: false,
        webComponents: {},
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
        useSuspense: false,
        useContextProvider: false,
        useActions: false,
        useHyperlink: true,
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
        useSuspense: false,
        useContextProvider: false,
        useActions: false,
        useHyperlink: false,
        webComponents: {
          'nested-component-1': nestedFile1.filePath,
          'nested-component-2': nestedFile2.filePath,
          'nested-component-3': 'nested-component-3.js',
        },
      });
    });
  });
});
