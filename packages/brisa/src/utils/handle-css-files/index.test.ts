import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import type { BrisaConstants } from '@/types';
import handleCSSFiles from '.';

const BUILD_DIR = path.join(import.meta.dirname, 'out');

describe('utils/handle-css-files', () => {
  beforeEach(() => {
    if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR);
    globalThis.mockConstants = { BUILD_DIR } as unknown as BrisaConstants;
  });
  afterEach(() => {
    fs.rmdirSync(BUILD_DIR, { recursive: true });
    globalThis.mockConstants = undefined;
  });

  it('should move all css files to the public folder', () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    handleCSSFiles();
    expect(
      fs.existsSync(path.join(BUILD_DIR, 'public', 'test.css')),
    ).toBeTrue();
  });

  it('should create a css-files.json file with the css file names', () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    handleCSSFiles();
    const cssFiles = JSON.parse(
      fs.readFileSync(path.join(BUILD_DIR, 'css-files.json'), 'utf-8'),
    );
    expect(cssFiles).toEqual(['test.css']);
  });

  it('should move multiple css files to the public folder', () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    fs.writeFileSync(
      path.join(BUILD_DIR, 'test2.css'),
      'body { color: blue; }',
    );
    handleCSSFiles();
    expect(
      fs.existsSync(path.join(BUILD_DIR, 'public', 'test.css')),
    ).toBeTrue();
    expect(
      fs.existsSync(path.join(BUILD_DIR, 'public', 'test2.css')),
    ).toBeTrue();
  });

  it('should create a css-files.json file with multiple css file names', () => {
    fs.writeFileSync(path.join(BUILD_DIR, 'test.css'), 'body { color: red; }');
    fs.writeFileSync(
      path.join(BUILD_DIR, 'test2.css'),
      'body { color: blue; }',
    );
    handleCSSFiles();
    const cssFiles = JSON.parse(
      fs.readFileSync(path.join(BUILD_DIR, 'css-files.json'), 'utf-8'),
    ).toSorted();
    expect(cssFiles).toEqual(['test.css', 'test2.css'].toSorted());
  });
});
