import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  spyOn,
  type Mock,
} from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import type { BrisaConstants } from '@/types';
import handleCSSFiles, { getCSSLoader } from '.';
import brisaTailwindCSS from 'brisa-tailwindcss';

const BUILD_DIR = path.join(import.meta.dirname, 'out');
const SRC_DIR = path.join(import.meta.dirname, 'src');
const LOG_PREFIX = {
  INFO: '[INFO]',
  TICK: '✔',
  WAIT: '[WAIT]',
} as BrisaConstants['LOG_PREFIX'];
let mockHash: Mock<(val: any) => any>;
let mockLog: Mock<Console['log']>;

describe('utils/handle-css-files', () => {
  beforeEach(() => {
    if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR);
    globalThis.mockConstants = {
      BUILD_DIR,
      SRC_DIR,
      LOG_PREFIX,
    } as unknown as BrisaConstants;
    mockHash = spyOn(Bun, 'hash');
    mockLog = spyOn(console, 'log');
    // Clear the require cache to avoid the css-files.js file to be cached
    delete require.cache[path.join(BUILD_DIR, 'css-files.js')];
  });

  afterEach(() => {
    fs.rmdirSync(BUILD_DIR, { recursive: true });
    globalThis.mockConstants = undefined;
    mockHash.mockRestore();
    mockLog.mockRestore();
  });

  it('should move (renombrar) to unic CSS file style-<hash>.css inside /public', async () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    mockHash.mockReturnValueOnce(123456);

    await handleCSSFiles();

    const newFilename = 'style-123456.css';
    expect(fs.existsSync(path.join(BUILD_DIR, 'public', newFilename))).toBeTrue();
  });

  it('should create a css-files.js file with the new CSS file names (renamed)', async () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    mockHash.mockReturnValueOnce(123456);

    await handleCSSFiles();

    const cssFiles = await import(path.join(BUILD_DIR, 'css-files.js')).then(
      (m) => m.default,
    );
    expect(cssFiles).toEqual(['style-123456.css']);
  });

  it('should move (rename) multi CSS files style-<hash>.css inside /public', async () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    fs.writeFileSync(path.join(BUILD_DIR, 'test2.css'), 'body { color: blue; }');

    mockHash.mockReturnValueOnce(111111).mockReturnValueOnce(222222);

    await handleCSSFiles();

    expect(
      fs.existsSync(path.join(BUILD_DIR, 'public', 'style-111111.css')),
    ).toBeTrue();
    expect(
      fs.existsSync(path.join(BUILD_DIR, 'public', 'style-222222.css')),
    ).toBeTrue();
  });

  it('should create a css-files.js file with multiple renamed css file names', async () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    fs.writeFileSync(path.join(BUILD_DIR, 'test2.css'), 'body { color: blue; }');

    mockHash
      .mockReturnValueOnce(111111)
      .mockReturnValueOnce(222222);

    await handleCSSFiles();

    const cssFiles = (
      await import(path.join(BUILD_DIR, 'css-files.js')).then((m) => m.default)
    ).toSorted();

    expect(cssFiles).toEqual(
      ['style-111111.css', 'style-222222.css'].toSorted(),
    );
  });

  it('should create a base.css content file using TailwindCSS integration when no file has @tailwind', async () => {
    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = { BUILD_DIR, CONFIG, LOG_PREFIX };

    mockHash.mockReturnValueOnce(999999); 

    await handleCSSFiles();

    const expectedFilename = 'base-999999.css';
    const cssFiles = (
      await import(path.join(BUILD_DIR, 'css-files.js')).then((m) => m.default)
    ).toSorted();

    expect(cssFiles).toEqual([expectedFilename].toSorted());
    expect(
      fs.existsSync(path.join(BUILD_DIR, 'public', expectedFilename)),
    ).toBeTrue();
    expect(
      fs.readFileSync(path.join(BUILD_DIR, 'public', expectedFilename), 'utf-8'),
    ).toContain('MIT License | https://tailwindcss.com');
  });

  it('should create the base-<hash>.css on front of the others when no file has @tailwind', async () => {
    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = { BUILD_DIR, CONFIG, LOG_PREFIX };

    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');

    mockHash.mockReturnValueOnce(111111).mockReturnValueOnce(222222);

    await handleCSSFiles();

    const baseCSSFilename = 'base-222222.css';
    const styleCSSFilename = 'style-111111.css';

    const cssFiles = (
      await import(path.join(BUILD_DIR, 'css-files.js')).then((m) => m.default)
    ).toSorted();

    expect(cssFiles).toEqual([baseCSSFilename, styleCSSFilename].toSorted());

    expect(fs.existsSync(path.join(BUILD_DIR, 'public', baseCSSFilename))).toBeTrue();
    expect(
      fs.readFileSync(path.join(BUILD_DIR, 'public', baseCSSFilename), 'utf-8'),
    ).toContain('MIT License | https://tailwindcss.com');
  });

  it('should NOT create a base.css file when some file has @tailwind', async () => {
    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = { BUILD_DIR, CONFIG, LOG_PREFIX };

    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), '@tailwind base;');

    mockHash.mockReturnValueOnce(111111);

    await handleCSSFiles();

    const cssFiles = (
      await import(path.join(BUILD_DIR, 'css-files.js')).then((m) => m.default)
    ).toSorted();

    expect(cssFiles).toEqual(['style-111111.css'].toSorted());
  });

  it('should NOT create a base.css file when some file has an import of "tailwindcss/*"', async () => {
    const code = `
      @import "tailwindcss/preflight" layer(base);
      @import "tailwindcss/utilities" layer(utilities);
      html {
        color: white;
      }
    `;
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), code);

    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = { BUILD_DIR, CONFIG, LOG_PREFIX };

    mockHash.mockReturnValueOnce(111111);

    await handleCSSFiles();

    const cssFiles = (
      await import(path.join(BUILD_DIR, 'css-files.js')).then((m) => m.default)
    ).toSorted();

    expect(cssFiles).toEqual(['style-111111.css'].toSorted());
  });

  it('should add a log during transpiling TailwindCSS if IS_BUILD_PROCESS is true', async () => {
    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = {
      BUILD_DIR,
      CONFIG,
      LOG_PREFIX,
      IS_BUILD_PROCESS: true,
    };

    mockHash.mockReturnValue(999999);

    await handleCSSFiles();

    expect(mockLog).toHaveBeenCalledTimes(2);
    expect(mockLog).toHaveBeenCalledWith(
      LOG_PREFIX.WAIT,
      `transpiling CSS with brisa-tailwindcss...`,
    );
    expect(mockLog).toHaveBeenCalledWith(
      LOG_PREFIX.INFO,
      LOG_PREFIX.TICK,
      expect.stringContaining('CSS transpiled with brisa-tailwindcss in'),
    );
  });

  it('should NOT add a log during transpiling TailwindCSS if IS_BUILD_PROCESS is false (serve)', async () => {
    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = {
      BUILD_DIR,
      SRC_DIR,
      CONFIG,
      LOG_PREFIX,
      IS_BUILD_PROCESS: false,
    };

    mockHash.mockReturnValue(999999);

    await handleCSSFiles();

    expect(mockLog).toHaveBeenCalledTimes(0);
  });

  it('should compress to gzip and brotli the CSS files when CONFIG.assetCompression && IS_PRODUCTION', async () => {
    const CONFIG = { assetCompression: true };
    globalThis.mockConstants = {
      BUILD_DIR,
      SRC_DIR,
      CONFIG,
      LOG_PREFIX,
      IS_PRODUCTION: true,
    };

    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    mockHash.mockReturnValueOnce(111111)

    await handleCSSFiles();

    expect(fs.readdirSync(path.join(BUILD_DIR, 'public')).toSorted()).toEqual(
      ['style-111111.css', 'style-111111.css.br', 'style-111111.css.gz'].toSorted(),
    );
  });

  it('should NOT compress to gzip/brotli in DEV mode (IS_PRODUCTION=false) even if assetCompression is true', async () => {
    const CONFIG = { assetCompression: true };
    globalThis.mockConstants = {
      BUILD_DIR,
      SRC_DIR,
      CONFIG,
      LOG_PREFIX,
      IS_PRODUCTION: false,
    };

    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    mockHash.mockReturnValueOnce(111111);

    await handleCSSFiles();

    expect(fs.readdirSync(path.join(BUILD_DIR, 'public'))).toEqual([
      'style-111111.css',
    ]);
  });
});

describe('getCSSLoader', () => {
  it('should return a plain text loader for CSS files when useExternalTranspiler is true', () => {
    globalThis.mockConstants = { CONFIG: { integrations: [{ transpileCSS: true }] } } as any;

    const loader = getCSSLoader();

    expect(loader).toEqual({
      '.css': 'text',
      '.scss': 'text',
      '.sass': 'text',
      '.less': 'text',
    });
  });

  it('should return a plain text loader for CSS files when useExternalTranspiler is false', () => {
    globalThis.mockConstants = { CONFIG: { integrations: [{ transpileCSS: false }] } } as any;

    const loader = getCSSLoader();

    expect(loader).toBeUndefined();
  });

  it('should return a plain text loader for CSS files when useExternalTranspiler is undefined', () => {
    globalThis.mockConstants = { CONFIG: {} };

    const loader = getCSSLoader();

    expect(loader).toBeUndefined();
  });
})
