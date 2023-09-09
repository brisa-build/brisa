import { gzipSync } from 'bun'

export default async function precompressAssets(assetsPath: string) {
  const assetsRouter = new Bun.FileSystemRouter({ dir: assetsPath, style: 'nextjs' })
  const assets = Object.values(assetsRouter.routes);

  await Promise.all(assets.map(async (asset) => {
    const assetContent = Bun.file(asset);
    const gzip = gzipSync(new Uint8Array((await assetContent.arrayBuffer())));

    Bun.write(`${asset}.gz`, gzip);
  }))
}
