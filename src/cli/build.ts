import path from "node:path";
import fs from "node:fs";
import getRootDir from "../utils/get-root-dir";
import logTable from "../utils/log-table";
import byteSizeToString from "../utils/byte-size-to-string";
import precompressAssets from "../utils/precompress-assets";

const projectDir = getRootDir();
const srcDir = path.join(projectDir, "src");
const pagesDir = path.join(srcDir, "pages");
const apiDir = path.join(srcDir, "api");
const outdir = path.join(projectDir, "build");
const outAssetsDir = path.join(outdir, "public");
const inAssetsDir = path.join(srcDir, "public");

const pagesRouter = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: pagesDir,
});

const apiRouter = new Bun.FileSystemRouter({ style: "nextjs", dir: apiDir });
const pagesEntrypoints = Object.values(pagesRouter.routes);
const apiEntrypoints = Object.values(apiRouter.routes);
const entrypoints = [...pagesEntrypoints, ...apiEntrypoints];
const { success, logs, outputs } = await Bun.build({
  entrypoints,
  outdir,
  minify: true,
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

// Copy all assets to the build directory
fs.cpSync(inAssetsDir, outAssetsDir, { recursive: true });

// Precompress all assets
await precompressAssets(outAssetsDir).catch(console.error);

console.info(`✨  Done in ${(Bun.nanoseconds() / 1000000).toFixed(2)}ms.`);
