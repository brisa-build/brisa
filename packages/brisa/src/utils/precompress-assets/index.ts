import path from 'node:path';
import { gzipSync } from 'bun';
import { brotliCompressSync } from 'node:zlib';
import getFilesFromDir from '@/utils/get-files-from-dir';
import { getConstants } from '@/constants';
import { blueLog, boldLog, greenLog } from '@/utils/log/log-color';

export default async function precompressAssets(assetsPath: string) {
  const { LOG_PREFIX, IS_PRODUCTION, CONFIG } = getConstants();

  if (!IS_PRODUCTION || !CONFIG.assetCompression) return null;

  const assets = await getFilesFromDir(assetsPath);

  console.log(LOG_PREFIX.INFO, `Precompressing ${assets.length} assets...`);

  await Promise.all(
    assets.map(async (asset) => {
      if (asset.endsWith('.gz') || asset.endsWith('.br')) return;

      const assetContent = Bun.file(asset);
      const assetName = asset.split(path.sep).pop() ?? asset;
      const buffer = new Uint8Array(await assetContent.arrayBuffer());
      const logGzipMsg = `${greenLog('Compressed')} ${blueLog(assetName)} ◆ ${boldLog('GZIP')}`;
      const logBrotliMsg = `${greenLog('Compressed')} ${blueLog(assetName)} ◆ ${boldLog('Brotli')}`;

      console.time(logGzipMsg);
      Bun.write(`${asset}.gz`, gzipSync(buffer));
      console.timeEnd(logGzipMsg);

      console.time(logBrotliMsg);
      Bun.write(`${asset}.br`, brotliCompressSync(buffer));
      console.timeEnd(logBrotliMsg);
    }),
  );
}
