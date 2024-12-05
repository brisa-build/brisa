import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import clientPageBuild from '.';
import { getConstants } from '@/constants';
import getWebComponentsList from '@/utils/get-web-components-list';
import type { BuildArtifact } from 'bun';
import type { WCsEntrypoints } from '../types';

const src = path.join(import.meta.dir, '..', '..', '..', '__fixtures__');
const build = path.join(src, `out-${crypto.randomUUID()}}`);
const webComponentsDir = path.join(src, 'web-components');
const brisaInternals = path.join(build, '_brisa');
const allWebComponents = await getWebComponentsList(src);
const pageWebComponents = {
  'web-component': allWebComponents['web-component'],
  'native-some-example': allWebComponents['native-some-example'],
};

const toArtifact = (path: string) =>
  ({ path, text: () => Bun.file(path).text() }) as BuildArtifact;

describe('client-build', () => {
  beforeEach(async () => {
    fs.mkdirSync(build, { recursive: true });
    fs.mkdirSync(brisaInternals, { recursive: true });
    const constants = getConstants() ?? {};
    globalThis.mockConstants = {
      ...constants,
      SRC_DIR: src,
      IS_PRODUCTION: true,
      IS_DEVELOPMENT: false,
      BUILD_DIR: src,
    };
  });

  afterEach(() => {
    fs.rmSync(build, { recursive: true });
    globalThis.mockConstants = undefined;
  });

  describe('clientPageBuild', () => {
    it('should not compile client code in page without web components, without suspense, without server actions', async () => {
      const pagePath = path.join(src, 'pages', 'somepage.tsx');
      const output = await clientPageBuild([toArtifact(pagePath)], {
        allWebComponents,
        webComponentsPerEntrypoint: {},
        layoutWebComponents: {},
      });

      expect(output).toEqual([
        {
          unsuspense: '',
          rpc: '',
          lazyRPC: '',
          pagePath: pagePath,
          code: '',
          size: 0,
          useContextProvider: false,
          useI18n: false,
          i18nKeys: new Set(),
          webComponents: {},
        },
      ]);
    });

    it('should return client code size of brisa + 2 web-components in page with web components', async () => {
      const pagePath = path.join(src, 'pages', 'page-with-web-component.tsx');
      const output = await clientPageBuild([toArtifact(pagePath)], {
        allWebComponents,
        webComponentsPerEntrypoint: {
          [pagePath]: pageWebComponents,
        },
        layoutWebComponents: {},
      });

      expect(output.length).toEqual(1);
      expect(output[0].size).toBeGreaterThan(0);
      expect(output[0].unsuspense).toBeEmpty();
      expect(output[0].rpc).toBeEmpty();
      expect(output[0].lazyRPC).toBeEmpty();
      expect(output[0].useContextProvider).toBe(false);
      expect(output[0].useI18n).toBe(true);
      expect(output[0].i18nKeys).toEqual(new Set(['hello']));
      expect(output[0].webComponents).toEqual({
        'web-component': allWebComponents['web-component'],
        'native-some-example': allWebComponents['native-some-example'],
      });
    });

    it('should return client code size of brisa + 2 wc + rpc + suspense', async () => {
      const pagePath = path.join(src, 'pages', 'index.tsx');
      const output = await clientPageBuild([toArtifact(pagePath)], {
        allWebComponents,
        webComponentsPerEntrypoint: {
          [pagePath]: pageWebComponents,
        },
        layoutWebComponents: {},
      });

      expect(output.length).toEqual(1);
      expect(output[0].size).toBeGreaterThan(0);
      expect(output[0].unsuspense).not.toBeEmpty();
      expect(output[0].rpc).not.toBeEmpty();
      expect(output[0].lazyRPC).not.toBeEmpty();
      expect(output[0].useContextProvider).toBe(false);
      expect(output[0].useI18n).toBe(true);
      expect(output[0].i18nKeys).toEqual(new Set(['hello']));
      expect(output[0].webComponents).toEqual({
        'web-component': allWebComponents['web-component'],
        'native-some-example': allWebComponents['native-some-example'],
      });
    });

    it('should build multi pages', async () => {
      const pagePath = path.join(src, 'pages', 'index.tsx');
      const pagePath2 = path.join(src, 'pages', 'page-with-web-component.tsx');

      const output = await clientPageBuild(
        [toArtifact(pagePath), toArtifact(pagePath2)],
        {
          allWebComponents,
          webComponentsPerEntrypoint: {
            [pagePath]: {},
            [pagePath2]: pageWebComponents,
          },
          layoutWebComponents: {},
        },
      );

      expect(output.length).toEqual(2);

      // First page
      expect(output[0].size).toBeGreaterThan(0);
      expect(output[0].unsuspense).not.toBeEmpty();
      expect(output[0].rpc).not.toBeEmpty();
      expect(output[0].lazyRPC).not.toBeEmpty();
      expect(output[0].useContextProvider).toBe(false);
      expect(output[0].useI18n).toBe(false);
      expect(output[0].i18nKeys).toBeEmpty();
      expect(output[0].webComponents).toBeEmpty();

      // Second page
      expect(output[1].size).toBeGreaterThan(0);
      expect(output[1].unsuspense).toBeEmpty();
      expect(output[1].rpc).toBeEmpty();
      expect(output[1].lazyRPC).toBeEmpty();
      expect(output[1].useContextProvider).toBe(false);
      expect(output[1].useI18n).toBe(true);
      expect(output[1].i18nKeys).toEqual(new Set(['hello']));
      expect(output[1].webComponents).toEqual({
        'web-component': allWebComponents['web-component'],
        'native-some-example': allWebComponents['native-some-example'],
      });
    });
  });

  it('should NOT add the integrations web context plugins when there are not plugins', async () => {
    const pagePath = path.join(src, 'pages', 'page-with-web-component.tsx');
    const integrationsPath = path.join(webComponentsDir, '_integrations.tsx');
    const output = await clientPageBuild([toArtifact(pagePath)], {
      allWebComponents,
      webComponentsPerEntrypoint: {
        [pagePath]: allWebComponents,
      },
      integrationsPath,
      layoutWebComponents: {},
    });

    // Declaration
    expect(output[0].code).not.toContain('window._P=');
    // Brisa element usage
    expect(output[0].code).not.toContain('._P)');
  });

  it('should add the integrations web context plugins when there are plugins', async () => {
    const pagePath = path.join(src, 'pages', 'page-with-web-component.tsx');
    const integrationsPath = path.join(webComponentsDir, '_integrations2.tsx');
    const output = await clientPageBuild([toArtifact(pagePath)], {
      allWebComponents,
      webComponentsPerEntrypoint: {
        [pagePath]: allWebComponents,
      },
      integrationsPath,
      layoutWebComponents: {},
    });

    // Declaration
    expect(output[0].code).toContain('window._P=');
    // Brisa element usage
    expect(output[0].code).toContain('._P)');
  });

  it('should correctly associate web components with entrypoints', async () => {
    const temp = path.join(src, 'pages', '.temp-test-files');

    if (fs.existsSync(temp)) {
      fs.rmSync(temp, { recursive: true });
    }
    fs.mkdirSync(temp);

    const entrypoints = [];
    const webComponentsPerEntrypoint: WCsEntrypoints = {};
    const allWCs = {};

    for (let i = 0; i < 20; i += 1) {
      const wcPath = path.join(temp, `wc-${i}-test.tsx`);

      fs.writeFileSync(wcPath, `export default () => <wc-${i}-test />;`);
      entrypoints.push(wcPath);
      Object.assign(allWCs, { [`wc-${i}-test`]: wcPath });

      Object.assign(webComponentsPerEntrypoint, {
        [wcPath]: { [`wc-${i}-test`]: wcPath },
      });
    }

    const output = await clientPageBuild(entrypoints.map(toArtifact), {
      allWebComponents: allWCs,
      webComponentsPerEntrypoint,
      layoutWebComponents: {},
    });

    fs.rmSync(temp, { recursive: true });
    expect(output.length).toEqual(entrypoints.length);

    for (const details of output) {
      const pathname = path.parse(details.pagePath).name;
      expect(details.code).toContain(pathname);
    }
  });
});
