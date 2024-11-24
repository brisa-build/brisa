import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdir, rm, writeFile, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { getClientBuildDetails } from '.';
import type { Options, WCs } from '../types';
import { getConstants } from '@/constants';

const TEMP_DIR = path.join(import.meta.dirname, '.temp-test-files');
const PAGES_DIR = path.join(TEMP_DIR, 'pages');
const INTERNAL_DIR = path.join(TEMP_DIR, '_brisa');

function createTempFileSync(dir: string, content: string, extension = 'tsx') {
  const fileName = `page-${Bun.hash(content)}.${extension}`;
  const filePath = path.join(dir, fileName);
  return { filePath, content };
}

async function writeTempFiles(
  files: Array<{ filePath: string; content: string }>,
) {
  await Promise.all(
    files.map(({ filePath, content }) => writeFile(filePath, content, 'utf-8')),
  );
}

describe('client build -> get-client-build-details', () => {
  beforeEach(async () => {
    await mkdir(PAGES_DIR, { recursive: true });
    await mkdir(INTERNAL_DIR, { recursive: true });
    globalThis.mockConstants = {
      ...getConstants(),
      PAGES_DIR,
      BUILD_DIR: TEMP_DIR,
    };
  });

  afterEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
    globalThis.mockConstants = undefined;
  });

  it('should process a single page without web components', async () => {
    const page = createTempFileSync(
      PAGES_DIR,
      `
      export default function Page() {
        return <div>Hello World</div>;
      }
    `,
    );

    await writeTempFiles([page]);

    const pages = [{ path: page.filePath }] as any;
    const options = {
      allWebComponents: {},
      webComponentsPerEntrypoint: {},
      layoutWebComponents: {},
      layoutHasContextProvider: false,
    };

    const result = await getClientBuildDetails(pages, options);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      unsuspense: '',
      rpc: '',
      lazyRPC: '',
      size: 0,
      code: '',
      useI18n: false,
      i18nKeys: new Set(),
      pagePath: page.filePath,
      useContextProvider: false,
      webComponents: {},
    });
  });

  it('should process a page with web components and generate an entrypoint', async () => {
    const page = createTempFileSync(
      PAGES_DIR,
      `
      export default function Page() {
        return <my-component>Hello World</my-component>;
      }
    `,
    );

    const wcFile = createTempFileSync(
      PAGES_DIR,
      `
      export default function MyComponent() {
        return <div>My Component</div>;
      }
    `,
    );

    await writeTempFiles([page, wcFile]);

    const webComponentsMap: WCs = {
      'my-component': wcFile.filePath,
    };

    const pages = [{ path: page.filePath }] as any;
    const options: Options = {
      allWebComponents: webComponentsMap,
      webComponentsPerEntrypoint: {
        [page.filePath]: webComponentsMap,
      },
      layoutWebComponents: {},
      layoutHasContextProvider: false,
    };

    const result = await getClientBuildDetails(pages, options);

    expect(result).toHaveLength(1);
    const entrypointResult = result[0];

    expect(entrypointResult).toMatchObject({
      unsuspense: '',
      rpc: '',
      lazyRPC: '',
      size: 0,
      code: '',
      useI18n: false,
      i18nKeys: new Set(),
      pagePath: page.filePath,
      useContextProvider: false,
      webComponents: {
        'my-component': wcFile.filePath,
      },
    });

    expect(entrypointResult.entrypoint).toBeDefined();
    expect(entrypointResult.useWebContextPlugins).toBe(false);

    // Validate the entrypoint file was written
    const entrypointDir = path.dirname(entrypointResult.entrypoint!);
    const files = await readdir(entrypointDir);
    expect(files).toContain(path.basename(entrypointResult.entrypoint!));

    const entrypointContent = await readFile(
      entrypointResult.entrypoint!,
      'utf-8',
    );
    expect(entrypointContent).toContain('my-component');
  });

  it('should skip non-page files', async () => {
    const nonPageFile = createTempFileSync(
      TEMP_DIR,
      `
      export default function NotAPage() {
        return <div>This is not a page</div>;
      }
    `,
    );

    await writeTempFiles([nonPageFile]);

    const pages = [{ path: nonPageFile.filePath }] as any;
    const options = {
      allWebComponents: {},
      webComponentsPerEntrypoint: {},
      layoutWebComponents: {},
      layoutHasContextProvider: false,
    };

    const result = await getClientBuildDetails(pages, options);

    expect(result).toHaveLength(0);
  });

  it('should handle multiple pages and aggregate results', async () => {
    const page1 = createTempFileSync(
      PAGES_DIR,
      `
      export default function Page1() {
        return <my-component>Hello Page 1</my-component>;
      }
    `,
    );

    const page2 = createTempFileSync(
      PAGES_DIR,
      `
      export default function Page2() {
        return <my-component>Hello Page 2</my-component>;
      }
    `,
    );

    const wcFile = createTempFileSync(
      PAGES_DIR,
      `
      export default function MyComponent() {
        return <div>My Component</div>;
      }
    `,
    );

    await writeTempFiles([page1, page2, wcFile]);

    const webComponentsMap: WCs = {
      'my-component': wcFile.filePath,
    };

    const pagesOutputs = [
      { path: page1.filePath },
      { path: page2.filePath },
    ] as any;

    const options = {
      allWebComponents: webComponentsMap,
      webComponentsPerEntrypoint: {
        [page2.filePath]: webComponentsMap,
        [page1.filePath]: webComponentsMap,
      },
      layoutWebComponents: {},
      layoutHasContextProvider: false,
    };

    const result = await getClientBuildDetails(pagesOutputs, options);
    const pages = [page1, page2];

    for (let i = 0; i < pages.length; i++) {
      const entrypointResult = result[i];

      expect(entrypointResult).toMatchObject({
        unsuspense: '',
        rpc: '',
        lazyRPC: '',
        pagePath: pages[i].filePath,
        size: 0,
        code: '',
        useI18n: false,
        i18nKeys: new Set(),
        useContextProvider: false,
        webComponents: {
          'my-component': wcFile.filePath,
        },
      });

      expect(entrypointResult.entrypoint).toBeDefined();

      const entrypointContent = await readFile(
        entrypointResult.entrypoint!,
        'utf-8',
      );
      expect(entrypointContent).toContain('my-component');
    }
  });

  it('should return rpc when there is an hyperlink', async () => {
    const page = createTempFileSync(
      PAGES_DIR,
      `
      export default function Page() {
        return <a href="/link">Click me</a>;
      }
    `,
    );

    await writeTempFiles([page]);
    const pages = [{ path: page.filePath }] as any;

    const options = {
      allWebComponents: {},
      webComponentsPerEntrypoint: {},
      layoutWebComponents: {},
      layoutHasContextProvider: false,
    };

    const result = await getClientBuildDetails(pages, options);

    // Valida que se generaron datos para RPC
    expect(result).toHaveLength(1);
    expect(result[0].rpc.length).toBeGreaterThan(0);
    expect(result[0].size).toBeGreaterThan(0);
  });
});
