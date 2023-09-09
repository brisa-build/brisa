import { gzipSync } from 'bun'
import { getFiles } from './get-all-files-from-dir';

// TODO: Support brotli when it's supported by Bun
export default async function precompressAssets(assetsPath: string) {
  const assets = await getFiles(assetsPath);

  await Promise.all(assets.map(async (asset) => {
    if (asset.endsWith('.gz')) return;

    const assetContent = Bun.file(asset);
    const gzip = gzipSync(new Uint8Array((await assetContent.arrayBuffer())));

    Bun.write(`${asset}.gz`, gzip);
  }))
}
