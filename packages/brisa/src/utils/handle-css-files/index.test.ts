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
import handleCSSFiles from '.';
import brisaTailwindCSS from 'brisa-tailwindcss';

const HASH = 123456;
const BUILD_DIR = path.join(import.meta.dirname, 'out');
const LOG_PREFIX = {
  INFO: '[INFO]',
  TICK: '✔',
} as BrisaConstants['LOG_PREFIX'];
let mockHash: Mock<(val: any) => any>;
let mockLog: Mock<Console['log']>;

describe('utils/handle-css-files', () => {
  beforeEach(() => {
    if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR);
    globalThis.mockConstants = {
      BUILD_DIR,
      LOG_PREFIX,
    } as unknown as BrisaConstants;
    mockHash = spyOn(Bun, 'hash').mockReturnValue(HASH);
    mockLog = spyOn(console, 'log');
  });
  afterEach(() => {
    fs.rmdirSync(BUILD_DIR, { recursive: true });
    globalThis.mockConstants = undefined;
    mockHash.mockRestore();
    mockLog.mockRestore();
  });

  it('should move all css files to the public folder', async () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    await handleCSSFiles();
    expect(
      fs.existsSync(path.join(BUILD_DIR, 'public', 'test.css')),
    ).toBeTrue();
  });

  it('should create a css-files.json file with the css file names', async () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    await handleCSSFiles();
    const cssFiles = JSON.parse(
      fs.readFileSync(path.join(BUILD_DIR, 'css-files.json'), 'utf-8'),
    );
    expect(cssFiles).toEqual(['test.css']);
  });

  it('should move multiple css files to the public folder', async () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    fs.writeFileSync(
      path.join(BUILD_DIR, 'test2.css'),
      'body { color: blue; }',
    );
    await handleCSSFiles();
    expect(
      fs.existsSync(path.join(BUILD_DIR, 'public', 'test.css')),
    ).toBeTrue();
    expect(
      fs.existsSync(path.join(BUILD_DIR, 'public', 'test2.css')),
    ).toBeTrue();
  });

  it('should create a css-files.json file with multiple css file names', async () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    fs.writeFileSync(
      path.join(BUILD_DIR, 'test2.css'),
      'body { color: blue; }',
    );
    await handleCSSFiles();
    const cssFiles = JSON.parse(
      fs.readFileSync(path.join(BUILD_DIR, 'css-files.json'), 'utf-8'),
    ).toSorted();
    expect(cssFiles).toEqual(['test.css', 'test2.css'].toSorted());
  });

  it('should create a base.css content file using TailwindCSS integration without any file has @tailwind', async () => {
    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = { BUILD_DIR, CONFIG, LOG_PREFIX };
    await handleCSSFiles();
    const expectedFilename = `base-${HASH}.css`;
    const expectedFilepath = path.join(BUILD_DIR, 'public', expectedFilename);
    const cssFiles = JSON.parse(
      fs.readFileSync(path.join(BUILD_DIR, 'css-files.json'), 'utf-8'),
    ).toSorted();

    expect(cssFiles).toEqual([expectedFilename].toSorted());
    expect(fs.existsSync(expectedFilepath)).toBeTrue();
    expect(fs.readFileSync(expectedFilepath, 'utf-8')).toContain(
      'MIT License | https://tailwindcss.com',
    );
  });

  it('should create the base.css on front of the others when any file has @tailwind', async () => {
    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = { BUILD_DIR, CONFIG, LOG_PREFIX };
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    await handleCSSFiles();
    const baseCSSFilename = `base-${HASH}.css`;
    const expectedFilepath = path.join(BUILD_DIR, 'public', baseCSSFilename);
    const cssFiles = JSON.parse(
      fs.readFileSync(path.join(BUILD_DIR, 'css-files.json'), 'utf-8'),
    ).toSorted();

    expect(cssFiles).toEqual([baseCSSFilename, 'test.css'].toSorted());
    expect(fs.existsSync(expectedFilepath)).toBeTrue();
    expect(fs.readFileSync(expectedFilepath, 'utf-8')).toContain(
      'MIT License | https://tailwindcss.com',
    );
  });

  it('should NOT create a base.css file when some file has @tailwind', async () => {
    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = { BUILD_DIR, CONFIG, LOG_PREFIX };
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), '@tailwind base;');
    await handleCSSFiles();
    const cssFiles = JSON.parse(
      fs.readFileSync(path.join(BUILD_DIR, 'css-files.json'), 'utf-8'),
    ).toSorted();
    expect(cssFiles).toEqual(['test.css'].toSorted());
  });

  it('should add a log during transpiling TailwindCSS', async () => {
    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = {
      BUILD_DIR,
      CONFIG,
      LOG_PREFIX,
      IS_BUILD_PROCESS: true,
    };
    await handleCSSFiles();
    expect(mockLog).toHaveBeenCalledTimes(2);
    expect(mockLog).toHaveBeenCalledWith(
      LOG_PREFIX.INFO,
      `Transpiling CSS with brisa-tailwindcss`,
    );
    expect(mockLog).toHaveBeenCalledWith(
      LOG_PREFIX.INFO,
      LOG_PREFIX.TICK,
      expect.stringContaining('CSS transpiled with brisa-tailwindcss in'),
    );
  });

  it('should NOT add a log during transpiling TailwindCSS in serve mode', async () => {
    const CONFIG = { integrations: [brisaTailwindCSS()] };
    globalThis.mockConstants = {
      BUILD_DIR,
      CONFIG,
      LOG_PREFIX,
      IS_BUILD_PROCESS: false,
    };
    await handleCSSFiles();
    expect(mockLog).toHaveBeenCalledTimes(0);
  });
});
