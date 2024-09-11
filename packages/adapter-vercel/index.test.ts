import type { BrisaConstants } from 'brisa';
import { describe, it, expect, afterEach, spyOn } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import vercelAdapter from './index';

const brisaConstants = {
  ROOT_DIR: import.meta.dirname,
  BUILD_DIR: path.join(import.meta.dirname, 'build'),
  CONFIG: {
    output: 'static',
  },
} as BrisaConstants;

const outDir = path.join(brisaConstants.ROOT_DIR, 'out');
const buildDir = path.join(brisaConstants.ROOT_DIR, 'build');
const vercelDir = path.join(brisaConstants.ROOT_DIR, '.vercel');
const outputConfigPath = path.join(vercelDir, 'output', 'config.json');
const logError = spyOn(console, 'error');
const logErrorMessage =
  'Vercel adapter only supports "node" and "static" output. Please set the "output" field in the brisa.config.ts file';

describe('adapter-vercel', () => {
  afterEach(async () => {
    await fs.rm(vercelDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.rm(buildDir, { recursive: true, force: true });
    process.env.VERCEL_SKEW_PROTECTION_ENABLED = undefined;
    process.env.VERCEL_DEPLOYMENT_ID = undefined;
    logError.mockClear();
  });
  it('should name be "vercel"', () => {
    const { name } = vercelAdapter();
    expect(name).toBe('vercel');
  });
  describe('output=android', () => {
    it('should not create .vercel/output/config.json if output is android', async () => {
      const generatedMap = await createBuildFixture(['index.html']);
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
      const generatedMap = await createBuildFixture(['index.html']);
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

  describe('output=bun', () => {
    it('should not create .vercel/output/config.json if output is "bun"', async () => {
      const generatedMap = await createBuildFixture(['index.html']);
      const { adapt } = vercelAdapter();
      await adapt(
        {
          ...brisaConstants,
          CONFIG: { ...brisaConstants.CONFIG, output: 'bun' },
        },
        generatedMap,
      );
      expect(await fs.exists(outputConfigPath)).toBe(false);
      expect(logError).toHaveBeenCalledWith(logErrorMessage);
    });
  });

  describe('output=node', () => {
    it('should create .vercel/output/config.json with version 3": prerendered pages + routing server system', async () => {
      const generatedMap = await createBuildFixture(
        ['index.html', 'about.html'],
        ['server.js'],
      );
      const { adapt } = vercelAdapter();
      await adapt(
        {
          ...brisaConstants,
          CONFIG: { ...brisaConstants.CONFIG, output: 'node' },
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
          {
            handle: 'filesystem',
          },
          {
            src: '/.*',
            dest: '/fn',
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

      const fnFunctionFolder = path.join(
        vercelDir,
        'output',
        'functions',
        'fn.func',
      );
      const packageJSON = path.join(fnFunctionFolder, 'package.json');
      const vcConfig = path.join(fnFunctionFolder, '.vc-config.json');
      const publicFolder = path.join(fnFunctionFolder, 'build', 'public');

      expect(await fs.exists(fnFunctionFolder)).toBe(true);
      expect(await fs.exists(packageJSON)).toBe(true);
      expect(fs.readFile(packageJSON, 'utf-8')).resolves.toBe(
        '{"type":"module"}',
      );
      expect(await fs.exists(vcConfig)).toBe(true);
      expect(JSON.parse(await fs.readFile(vcConfig, 'utf-8'))).toEqual({
        runtime: 'nodejs20.x',
        handler: 'build/server.js',
        launcherType: 'Nodejs',
        experimentalResponseStreaming: true,
        environment: {
          USE_HANDLER: 'true',
        },
      });
      expect(await fs.exists(publicFolder)).toBe(true);
      expect((await fs.readdir(publicFolder)).length).toBe(2);
    });
    it('shoudld enable skew protection', async () => {
      process.env.VERCEL_SKEW_PROTECTION_ENABLED = 'true';
      process.env.VERCEL_DEPLOYMENT_ID = '123';

      const generatedMap = await createBuildFixture([
        'index.html',
        'about.html',
      ]);

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
          {
            continue: true,
            has: [
              {
                key: 'Sec-Fetch-Dest',
                type: 'header',
                value: 'document',
              },
            ],
            headers: {
              'Set-Cookie':
                '__vdpl=123; Path=/; SameSite=Strict; Secure; HttpOnly',
            },
            src: '/.*',
          },
        ],
        overrides: {
          'about.html': {
            path: 'about',
          },
          'index.html': {
            path: '',
          },
        },
      });
    });

    it('should enable skew protection with a base path', async () => {
      process.env.VERCEL_SKEW_PROTECTION_ENABLED = 'true';
      process.env.VERCEL_DEPLOYMENT_ID = '123';

      const generatedMap = await createBuildFixture([
        'index.html',
        'about.html',
      ]);

      const { adapt } = vercelAdapter();

      await adapt(
        {
          ...brisaConstants,
          CONFIG: { ...brisaConstants.CONFIG, basePath: '/base' },
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
          {
            continue: true,
            has: [
              {
                key: 'Sec-Fetch-Dest',
                type: 'header',
                value: 'document',
              },
            ],
            headers: {
              'Set-Cookie':
                '__vdpl=123; Path=/base/; SameSite=Strict; Secure; HttpOnly',
            },
            src: '/.*',
          },
        ],
        overrides: {
          'about.html': {
            path: 'about',
          },
          'index.html': {
            path: '',
          },
        },
      });
    });

    it('should add the "memory" config option to .vc-config.json', async () => {
      const vcConfig = path.join(
        vercelDir,
        'output',
        'functions',
        'fn.func',
        '.vc-config.json',
      );
      const generatedMap = await createBuildFixture([], ['server.js']);
      const { adapt } = vercelAdapter({ memory: 1024 });

      await adapt(
        {
          ...brisaConstants,
          CONFIG: { ...brisaConstants.CONFIG, output: 'node' },
        },
        generatedMap,
      );
      expect(JSON.parse(await fs.readFile(vcConfig, 'utf-8'))).toEqual({
        environment: {
          USE_HANDLER: 'true',
        },
        handler: 'build/server.js',
        launcherType: 'Nodejs',
        runtime: 'nodejs20.x',
        experimentalResponseStreaming: true,
        memory: 1024,
      });
    });

    it('should add the "regions" config option to .vc-config.json', async () => {
      const vcConfig = path.join(
        vercelDir,
        'output',
        'functions',
        'fn.func',
        '.vc-config.json',
      );
      const generatedMap = await createBuildFixture([], ['server.js']);
      const { adapt } = vercelAdapter({ regions: ['iad1', 'lax1'] });

      await adapt(
        {
          ...brisaConstants,
          CONFIG: { ...brisaConstants.CONFIG, output: 'node' },
        },
        generatedMap,
      );
      expect(JSON.parse(await fs.readFile(vcConfig, 'utf-8'))).toEqual({
        environment: {
          USE_HANDLER: 'true',
        },
        handler: 'build/server.js',
        launcherType: 'Nodejs',
        runtime: 'nodejs20.x',
        experimentalResponseStreaming: true,
        regions: ['iad1', 'lax1'],
      });
    });

    it('should add the "maxDuration" config option to .vc-config.json', async () => {
      const vcConfig = path.join(
        vercelDir,
        'output',
        'functions',
        'fn.func',
        '.vc-config.json',
      );
      const generatedMap = await createBuildFixture([], ['server.js']);
      const { adapt } = vercelAdapter({ maxDuration: 15 });

      await adapt(
        {
          ...brisaConstants,
          CONFIG: { ...brisaConstants.CONFIG, output: 'node' },
        },
        generatedMap,
      );
      expect(JSON.parse(await fs.readFile(vcConfig, 'utf-8'))).toEqual({
        environment: {
          USE_HANDLER: 'true',
        },
        handler: 'build/server.js',
        launcherType: 'Nodejs',
        runtime: 'nodejs20.x',
        experimentalResponseStreaming: true,
        maxDuration: 15,
      });
    });
  });

  describe('output=static', () => {
    it('should create .vercel/output/config.json with version 3, routes and overrides depending on "out" path', async () => {
      const generatedMap = await createBuildFixture([
        'index.html',
        'about.html',
      ]);
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
      let generatedMap = await createBuildFixture(['index.html', 'about.html']);
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
      const generatedMap = await createBuildFixture([
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
      const generatedMap = await createBuildFixture([
        'index.html',
        'about.html',
      ]);
      const { adapt } = vercelAdapter();
      await adapt(brisaConstants, generatedMap);
      expect(await fs.exists(path.join(vercelDir, 'output', 'static'))).toBe(
        true,
      );
      expect(
        await fs.readdir(path.join(vercelDir, 'output', 'static')),
      ).toEqual(['index.html', 'about.html']);
    });

    it('should create a filesystem handle when _404 page is present', async () => {
      const generatedMap = await createBuildFixture([
        'index.html',
        '_404.html',
      ]);

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
            src: '/_404',
            dest: '/_404/',
          },
          {
            src: '/_404/',
            status: 308,
            headers: {
              Location: '/_404',
            },
          },
          {
            handle: 'filesystem',
          },
          { src: '/(.*)', status: 404, dest: '/_404' },
        ],
        overrides: {
          'index.html': {
            path: '',
          },
          '_404.html': {
            path: '_404',
          },
        },
      });
    });

    it('should create a filesystem handle when _404 page in i18n pages is present', async () => {
      const generatedMap = await createBuildFixture([
        'index.html',
        'en/index.html',
        'en/_404.html',
        'es/index.html',
        'es/_404.html',
      ]);

      const { adapt } = vercelAdapter();
      await adapt(
        {
          ...brisaConstants,
          I18N_CONFIG: {
            locales: ['en', 'es'],
            defaultLocale: 'en',
          },
        },
        generatedMap,
      );
      expect(logError).not.toHaveBeenCalled();
      expect(JSON.parse(await fs.readFile(outputConfigPath, 'utf-8'))).toEqual({
        version: 3,
        routes: [
          {
            src: '/',
            status: 308,
            headers: {
              Location: '/en',
            },
          },
          {
            src: '/en',
            dest: '/en/',
          },
          {
            src: '/en/',
            status: 308,
            headers: {
              Location: '/en',
            },
          },
          {
            src: '/en/_404',
            dest: '/en/_404/',
          },
          {
            src: '/en/_404/',
            status: 308,
            headers: {
              Location: '/en/_404',
            },
          },
          {
            src: '/es',
            dest: '/es/',
          },
          {
            src: '/es/',
            status: 308,
            headers: {
              Location: '/es',
            },
          },
          {
            src: '/es/_404',
            dest: '/es/_404/',
          },
          {
            src: '/es/_404/',
            status: 308,
            headers: {
              Location: '/es/_404',
            },
          },
          {
            handle: 'filesystem',
          },
          { src: '/(.*)', status: 404, dest: '/en/_404' },
        ],
        overrides: {
          'en/index.html': {
            path: 'en',
          },
          'en/_404.html': {
            path: 'en/_404',
          },
          'es/index.html': {
            path: 'es',
          },
          'es/_404.html': {
            path: 'es/_404',
          },
        },
      });
    });
  });
});

async function createBuildFixture(
  staticFiles: string[],
  buildFiles?: string[],
) {
  const map = new Map<string, string[]>();
  const staticFolder = buildFiles?.length
    ? path.join(buildDir, 'public')
    : outDir;

  await fs.rm(staticFolder, { recursive: true, force: true });
  await fs.mkdir(staticFolder, { recursive: true });

  for (const file of staticFiles) {
    const folders = file.split(path.sep).slice(0, -1);
    for (let i = 1; i <= folders.length; i++) {
      const folder = path.join(staticFolder, ...folders.slice(0, i));

      if (!(await fs.exists(folder))) {
        await fs.mkdir(folder);
      }
    }
    await fs.writeFile(path.join(staticFolder, file), '');
    map.set(file, [file]);
  }

  for (const buildFile of buildFiles ?? []) {
    fs.writeFile(path.join(buildDir, buildFile), '');
  }

  return map;
}
