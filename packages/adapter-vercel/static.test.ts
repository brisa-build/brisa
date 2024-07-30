import type { BrisaConstants } from 'brisa';
import { describe, it, expect } from 'bun:test';
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
const outputConfigPath = path.join(
  brisaConstants.ROOT_DIR,
  '.vercel',
  'output',
  'config.json',
);

describe('adapter-vercel', () => {
  it('should name be "vercel"', () => {
    const { name } = vercelAdapter();
    expect(name).toBe('vercel');
  });
  it('should create .vercel/output/config.json with version 3, routes and overrides depending on "out" path', async () => {
    const generatedMap = await createOutFixture(['index.html', 'about.html']);
    const { adapt } = vercelAdapter();
    await adapt(brisaConstants, generatedMap);
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
});

async function createOutFixture(pages: string[]) {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir);
  for (const pagePath of pages) {
    const folders = pagePath.split(path.sep).slice(0, -1);
    for (let i = 1; i <= folders.length; i++) {
      await fs.mkdir(path.join(outDir, ...folders.slice(0, i)));
    }
    await fs.writeFile(path.join(outDir, pagePath), '');
  }

  const map = new Map<string, string[]>();

  for (const page of pages) {
    map.set(page, [page]);
  }

  return map;
}
