import path from "node:path";
import fs from "node:fs";
import getRootDir from "../utils/get-root-dir";
import logTable from "../utils/log-table";
import byteSizeToString from "../utils/byte-size-to-string";
import precompressAssets from "../utils/precompress-assets";
import getEntrypoints from "../utils/get-entrypoints";

const projectDir = getRootDir();
const srcDir = path.join(projectDir, "src");
const pagesDir = path.join(srcDir, "pages");
const apiDir = path.join(srcDir, "api");
let outdir = path.join(projectDir, "build");
const outAssetsDir = path.join(outdir, "public");
const inAssetsDir = path.join(srcDir, "public");
const pagesEntrypoints = getEntrypoints(pagesDir);
const apiEntrypoints = getEntrypoints(apiDir);
const entrypoints = [...pagesEntrypoints, ...apiEntrypoints];

// This fix Bun build with only one entrypoint because it doesn't create the subfolder
if (entrypoints.length === 1) {
  const subfolder = entrypoints[0].includes(path.join(outdir, "api")) ? 'api' : 'pages';
  outdir = path.join(outdir, subfolder);
}

const { success, logs, outputs } = await Bun.build({
  entrypoints,
  outdir,
  minify: true,
  sourcemap: "external",
});

if (!success) {
  logs.forEach((log) => console.error(log));
  process.exit(1);
}

logTable(
  outputs.map((output) => ({
    Route: `λ ${output.path.replace(outdir, "")}`,
    Size: byteSizeToString(output.size, 0),
  })),
);

console.log("\nλ  (Server)  server-side renders at runtime\n");

if (fs.existsSync(inAssetsDir)) {
  // Copy all assets to the build directory
  fs.cpSync(inAssetsDir, outAssetsDir, { recursive: true });

  // Precompress all assets
  await precompressAssets(outAssetsDir).catch(console.error);
}

console.info(`✨  Done in ${(Bun.nanoseconds() / 1000000).toFixed(2)}ms.`);
