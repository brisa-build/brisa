import type { BrisaConstants } from 'brisa';
import { describe, it, expect, beforeAll } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import vercelAdapter from './index';

const brisaConstants = {
  ROOT_DIR: import.meta.dirname,
  CONFIG: {
    output: 'static',
  },
} as BrisaConstants;

const generatedMap = new Map<string, string[]>([
  ['pages/index.js', ['index.html']],
  ['pages/about.js', ['about.html']],
]);

const outDir = path.join(brisaConstants.ROOT_DIR, 'out');
const outputConfigPath = path.join(
  brisaConstants.ROOT_DIR,
  '.vercel',
  'output',
  'config.json',
);

describe('adapter-vercel', () => {
  beforeAll(async () => {
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(outDir);
    await fs.writeFile(path.join(outDir, 'index.html'), '<h1>Index</h1>');
    await fs.writeFile(path.join(outDir, 'about.html'), '<h1>About</h1>');
  });

  it('should name be "vercel"', () => {
    const { name } = vercelAdapter();
    expect(name).toBe('vercel');
  });
  it('should create .vercel/output/config.json with version 3, routes and overrides depending on "out" path', async () => {
    const { adapt } = vercelAdapter();
    await adapt(brisaConstants, generatedMap);
    expect((await import(outputConfigPath)).default).toEqual({
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
});
