import path from "node:path";
import fs from "node:fs";

import getConstants from "../../constants";
import getRootDir from "../get-root-dir";
import precompressAssets from "../precompress-assets";

export default async function compileAssets(
  outdir = path.join(getRootDir(), "build"),
) {
  const { SRC_DIR } = getConstants();
  const outAssetsDir = path.join(outdir, "public");
  const inAssetsDir = path.join(SRC_DIR, "public");

  if (fs.existsSync(inAssetsDir)) {
    // Copy all assets to the build directory
    fs.cpSync(inAssetsDir, outAssetsDir, { recursive: true });

    // Precompress all assets
    await precompressAssets(outAssetsDir).catch(console.error);
  }
}
