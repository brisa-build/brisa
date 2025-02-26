import path from 'node:path';
import fs from 'node:fs';

import { getConstants } from '@/constants';
import precompressAssets from '@/utils/precompress-assets';
import getImportableFilepath from '../get-importable-filepath';
import sitemapToXml from '../sitemap-to-xml';

export default async function compileAssets() {
  const { SRC_DIR, BUILD_DIR, IS_PRODUCTION, LOG_PREFIX } = getConstants();
  const outAssetsDir = path.join(BUILD_DIR, 'public');
  const inAssetsDir = path.join(SRC_DIR, 'public');

  if (!fs.existsSync(outAssetsDir)) {
    fs.mkdirSync(outAssetsDir, { recursive: true });
  }

  if (fs.existsSync(inAssetsDir)) {
    // Copy all assets to the build directory
    fs.cpSync(inAssetsDir, outAssetsDir, { recursive: true });

    // Precompress all assets
    await precompressAssets(outAssetsDir).catch(console.error);
  }

  // Generate sitemap.xml
  if (IS_PRODUCTION) {
    const sitemapPathname = getImportableFilepath('sitemap', SRC_DIR);
    if (!sitemapPathname) return;

    const start = Date.now();
    const sitemap = (await import(sitemapPathname)).default;
    fs.writeFileSync(
      path.join(outAssetsDir, 'sitemap.xml'),
      await sitemapToXml(sitemap),
    );
    const end = Date.now();
    const ms = ((end - start) / 1000).toFixed(2);
    console.log(
      LOG_PREFIX.INFO,
      LOG_PREFIX.TICK,
      `sitemap.xml generated in ${ms}ms`,
    );
  }
}
