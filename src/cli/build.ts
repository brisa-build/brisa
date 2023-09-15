import path from "node:path";
import fs from "node:fs";
import getRootDir from "../utils/get-root-dir";
import logTable from "../utils/log-table";
import byteSizeToString from "../utils/byte-size-to-string";
import precompressAssets from "../utils/precompress-assets";
import getEntrypoints from "../utils/get-entrypoints";
import getImportableFilepath from "../utils/get-importable-filepath";

const srcDir = getRootDir('development');
const pagesDir = path.join(srcDir, "pages");
const apiDir = path.join(srcDir, "api");
let outdir = getRootDir('production');
const outAssetsDir = path.join(outdir, "public");
const inAssetsDir = path.join(srcDir, "public");
const pagesEntrypoints = getEntrypoints(pagesDir);
const apiEntrypoints = getEntrypoints(apiDir);
const middlewarePath = getImportableFilepath('middleware', srcDir);
const layoutPath = getImportableFilepath('layout', srcDir);
const entrypoints = [...pagesEntrypoints, ...apiEntrypoints];

if (middlewarePath) entrypoints.push(middlewarePath);
if (layoutPath) entrypoints.push(layoutPath);

// This fix Bun build with only one entrypoint because it doesn't create the subfolder
if (entrypoints.length === 1) {
  const subfolder = entrypoints[0].includes(path.join(outdir, "api"))
    ? "api"
    : "pages";
  outdir = path.join(outdir, subfolder);
}

const { success, logs, outputs } = await Bun.build({
  entrypoints,
  outdir,
  root: srcDir,
  minify: true,
  splitting: true,
});

if (!success) {
  logs.forEach((log) => console.error(log));
  process.exit(1);
}

logTable(
  outputs.map((output) => {
    let symbol = 'λ';

    if (output.kind === 'chunk') symbol = 'Φ';
    if (output.path.startsWith('/middleware')) symbol = 'ƒ';
    if (output.path.startsWith('/layout')) symbol = 'Δ';

    return {
      Route: `λ ${output.path.replace(outdir, "")}`,
      Size: byteSizeToString(output.size, 0),
    }
  }),
);

console.log("\nλ  Server entry-points \n");
console.log("Φ JS shared by all\n");
console.log("ƒ  Middleware \n");

if (fs.existsSync(inAssetsDir)) {
  // Copy all assets to the build directory
  fs.cpSync(inAssetsDir, outAssetsDir, { recursive: true });

  // Precompress all assets
  await precompressAssets(outAssetsDir).catch(console.error);
}

console.info(`✨  Done in ${(Bun.nanoseconds() / 1000000).toFixed(2)}ms.`);
