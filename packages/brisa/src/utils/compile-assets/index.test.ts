import path from 'node:path';
import fs from 'node:fs';
import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import compileAssets from '.';
import { getConstants } from '@/constants';
import { toInline } from '@/helpers';

const SRC_DIR = path.join(import.meta.dir, '..', '..', '__fixtures__');
const BUILD_DIR = path.join(SRC_DIR, 'build');
const PAGES_DIR = path.join(BUILD_DIR, 'pages');
const ASSETS_DIR = path.join(BUILD_DIR, 'public');
const CLIENT_PAGES = path.join(BUILD_DIR, 'pages-client');

describe('compileAssets', () => {
  beforeEach(() => {
    fs.mkdirSync(BUILD_DIR);
    fs.mkdirSync(CLIENT_PAGES);
    fs.writeFileSync(path.join(CLIENT_PAGES, 'index.js'), '');
  });

  afterEach(() => {
    fs.rmSync(BUILD_DIR, { recursive: true });
  });

  beforeEach(async () => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      PAGES_DIR,
      BUILD_DIR,
      SRC_DIR,
      ASSETS_DIR,
      IS_PRODUCTION: true,
      CONFIG: {
        assetCompression: true,
      },
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  it('should compile fixtures assets correctly', async () => {
    await compileAssets();
    expect(fs.readdirSync(BUILD_DIR).toSorted()).toEqual(
      ['public', 'pages-client'].toSorted(),
    );
    expect(fs.readdirSync(path.join(BUILD_DIR, 'public')).toSorted()).toEqual(
      [
        'favicon.ico',
        'favicon.ico.br',
        'favicon.ico.gz',
        'some-dir',
        'sitemap.xml',
      ].toSorted(),
    );
    expect(
      fs.readdirSync(path.join(BUILD_DIR, 'public', 'some-dir')).toSorted(),
    ).toEqual(
      [
        'some-text.txt.br',
        'some-img.png.br',
        'some-text.txt.gz',
        'some-img.png.gz',
        'some-img.png',
        'some-text.txt',
      ].toSorted(),
    );
  });

  it('should not compress fixtures assets in development and neither create the sitemap.xml', async () => {
    globalThis.mockConstants!.IS_PRODUCTION = false;
    await compileAssets();
    expect(fs.readdirSync(path.join(BUILD_DIR, 'public')).toSorted()).toEqual(
      ['favicon.ico', 'some-dir'].toSorted(),
    );
  });

  it('should not compress fixtures assets if assetCompression is false', async () => {
    globalThis.mockConstants!.CONFIG!.assetCompression = false;
    await compileAssets();
    expect(fs.readdirSync(path.join(BUILD_DIR, 'public')).toSorted()).toEqual(
      ['favicon.ico', 'some-dir', 'sitemap.xml'].toSorted(),
    );
  });

  it('should create the sitemap.xml asset file according src/sitemap.ts file in Production', async () => {
    const sitemapFilepath = path.join(BUILD_DIR, 'public', 'sitemap.xml');

    await compileAssets();

    expect(fs.existsSync(sitemapFilepath)).toBeTrue();
    expect(toInline(fs.readFileSync(sitemapFilepath, 'utf-8'))).toEqual(
      toInline(`<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com</loc>
            <lastmod>2021-10-01T00:00:00.000Z</lastmod>
            <changefreq>daily</changefreq>
            <priority>1.0</priority>
            <image:image>
              <image:loc>https://example.com/image.jpg</image:loc>
              <image:title>Image title</image:title>
              <image:caption>Image caption</image:caption>
            </image:image>
          </url>
        </urlset>
      `),
    );
  });
});
