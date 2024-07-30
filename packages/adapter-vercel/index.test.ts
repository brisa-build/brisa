import type { BrisaConstants } from 'brisa';
import { describe, it, expect, afterEach, spyOn } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import vercelAdapter from './index';

const brisaConstants = {
  ROOT_DIR: import.meta.dirname,
  CONFIG: {
    output: 'static',
  },
} as BrisaConstants;

const outDir = path.join(brisaConstants.ROOT_DIR, 'out');
const vercelDir = path.join(brisaConstants.ROOT_DIR, '.vercel');
const outputConfigPath = path.join(vercelDir, 'output', 'config.json');
const logError = spyOn(console, 'error');
const logErrorMessage =
  'Vercel adapter only supports static output. Please set the output to "static" in the brisa.config.ts file';

describe('adapter-vercel', () => {
  afterEach(async () => {
    await fs.rm(vercelDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
    logError.mockClear();
  });
  it('should name be "vercel"', () => {
    const { name } = vercelAdapter();
    expect(name).toBe('vercel');
  });
  describe('output=android', () => {
    it('should not create .vercel/output/config.json if output is android', async () => {
      const generatedMap = await createOutFixture(['index.html']);
      const { adapt } = vercelAdapter();
      await adapt(
        {
          ...brisaConstants,
          CONFIG: { ...brisaConstants.CONFIG, output: 'android' },
        },
        generatedMap,
      );
      expect(await fs.exists(outputConfigPath)).toBe(false);
      expect(logError).toHaveBeenCalledWith(logErrorMessage);
    });
  });
  describe('output=ios', () => {
    it('should not create .vercel/output/config.json if output is ios', async () => {
      const generatedMap = await createOutFixture(['index.html']);
      const { adapt } = vercelAdapter();
      await adapt(
        {
          ...brisaConstants,
          CONFIG: { ...brisaConstants.CONFIG, output: 'ios' },
        },
        generatedMap,
      );
      expect(await fs.exists(outputConfigPath)).toBe(false);
      expect(logError).toHaveBeenCalledWith(logErrorMessage);
    });
  });

  describe('output=server', () => {
    // This is temporal, in the near future we are going to support this
    it('should not create .vercel/output/config.json if output is server', async () => {
      const generatedMap = await createOutFixture(['index.html']);
      const { adapt } = vercelAdapter();
      await adapt(
        {
          ...brisaConstants,
          CONFIG: { ...brisaConstants.CONFIG, output: 'server' },
        },
        generatedMap,
      );
      expect(await fs.exists(outputConfigPath)).toBe(false);
      expect(logError).toHaveBeenCalledWith(logErrorMessage);
    });
  });

  describe('output=static', () => {
    it('should create .vercel/output/config.json with version 3, routes and overrides depending on "out" path', async () => {
      const generatedMap = await createOutFixture(['index.html', 'about.html']);
      const { adapt } = vercelAdapter();
      await adapt(brisaConstants, generatedMap);
      expect(logError).not.toHaveBeenCalled();
      expect(JSON.parse(await fs.readFile(outputConfigPath, 'utf-8'))).toEqual({
        version: 3,
        routes: [
          {
            src: '/',
            dest: '/index.html',
          },
          {
            src: '/about',
            dest: '/about/',
          },
          {
            src: '/about/',
            status: 308,
            headers: {
              Location: '/about',
            },
          },
        ],
        overrides: {
          'index.html': {
            path: '',
          },
          'about.html': {
            path: 'about',
          },
        },
      });
    });

    it('should create .vercel/output/config.json starting the page with "/"', async () => {
      let generatedMap = await createOutFixture(['index.html', 'about.html']);
      const entries = Array.from(generatedMap.entries());

      // There are cases, ex; i18n, where the page path starts with "/"
      for (const page of entries) {
        page[1] = page[1].map((pagePath) => '/' + pagePath);
      }

      generatedMap = new Map(entries);

      const { adapt } = vercelAdapter();
      await adapt(brisaConstants, generatedMap);
      expect(logError).not.toHaveBeenCalled();
      expect(JSON.parse(await fs.readFile(outputConfigPath, 'utf-8'))).toEqual({
        version: 3,
        routes: [
          {
            src: '/',
            dest: '/index.html',
          },
          {
            src: '/about',
            dest: '/about/',
          },
          {
            src: '/about/',
            status: 308,
            headers: {
              Location: '/about',
            },
          },
        ],
        overrides: {
          'index.html': {
            path: '',
          },
          'about.html': {
            path: 'about',
          },
        },
      });
    });

    it('should create .vercel/output/index.html taking account CONFIG.trailingSlash', async () => {
      const generatedMap = await createOutFixture([
        'index.html',
        path.join('about', 'index.html'),
      ]);
      const { adapt } = vercelAdapter();
      await adapt(
        {
          ...brisaConstants,
          CONFIG: { ...brisaConstants.CONFIG, trailingSlash: true },
        },
        generatedMap,
      );

      expect(logError).not.toHaveBeenCalled();
      expect(JSON.parse(await fs.readFile(outputConfigPath, 'utf-8'))).toEqual({
        version: 3,
        routes: [
          {
            src: '/',
            dest: '/index.html',
          },
          {
            src: '/about/',
            dest: '/about',
          },
          {
            src: '/about',
            status: 308,
            headers: {
              Location: '/about/',
            },
          },
        ],
        overrides: {
          'index.html': {
            path: '',
          },
          'about/index.html': {
            path: 'about',
          },
        },
      });
    });

    it('should move the content of the "out" folder to ".vercel/output/static" folder', async () => {
      const generatedMap = await createOutFixture(['index.html', 'about.html']);
      const { adapt } = vercelAdapter();
      await adapt(brisaConstants, generatedMap);
      expect(await fs.exists(path.join(vercelDir, 'output', 'static'))).toBe(
        true,
      );
      expect(
        await fs.readdir(path.join(vercelDir, 'output', 'static')),
      ).toEqual(['index.html', 'about.html']);
    });
  });
});

async function createOutFixture(pages: string[]) {
  const map = new Map<string, string[]>();

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir);
  for (const pagePath of pages) {
    const folders = pagePath.split(path.sep).slice(0, -1);
    for (let i = 1; i <= folders.length; i++) {
      await fs.mkdir(path.join(outDir, ...folders.slice(0, i)));
    }
    await fs.writeFile(path.join(outDir, pagePath), '');
    map.set(pagePath, [pagePath]);
  }

  return map;
}
