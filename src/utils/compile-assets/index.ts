import path from "node:path";
import fs from "node:fs";

import { getConstants } from "@/constants";
import precompressAssets from "@/utils/precompress-assets";

export default async function compileAssets() {
  const { SRC_DIR, BUILD_DIR } = getConstants();
  const outAssetsDir = path.join(BUILD_DIR, "public");
  const inAssetsDir = path.join(SRC_DIR, "public");

  if (!fs.existsSync(outAssetsDir)) {
    fs.mkdirSync(outAssetsDir, { recursive: true });
  }

  if (fs.existsSync(inAssetsDir)) {
    // Copy all assets to the build directory
    fs.cpSync(inAssetsDir, outAssetsDir, { recursive: true });

    // Precompress all assets
    await precompressAssets(outAssetsDir).catch(console.error);
  }
}
