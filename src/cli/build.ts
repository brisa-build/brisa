import path from "node:path";
import fs from "node:fs";
import getRootDir from "../utils/get-root-dir";
import logTable from "../utils/log-table";
import byteSizeToString from "../utils/byte-size-to-string";
import precompressAssets from "../utils/precompress-assets";
import getEntrypoints from "../utils/get-entrypoints";
import getImportableFilepath from "../utils/get-importable-filepath";
import getConstants from "../constants";

const { SRC_DIR, CONFIG } = getConstants();
const pagesDir = path.join(SRC_DIR, "pages");
const apiDir = path.join(SRC_DIR, "api");
let outdir = getRootDir("production");
const outAssetsDir = path.join(outdir, "public");
const inAssetsDir = path.join(SRC_DIR, "public");
const pagesEntrypoints = getEntrypoints(pagesDir);
const apiEntrypoints = getEntrypoints(apiDir);
const middlewarePath = getImportableFilepath("middleware", SRC_DIR);
const layoutPath = getImportableFilepath("layout", SRC_DIR);
const i18nPath = getImportableFilepath("i18n", SRC_DIR);
const entrypoints = [...pagesEntrypoints, ...apiEntrypoints];

if (middlewarePath) entrypoints.push(middlewarePath);
if (layoutPath) entrypoints.push(layoutPath);
if (i18nPath) entrypoints.push(i18nPath);

// This fix Bun build with only one entrypoint because it doesn't create the subfolder
if (entrypoints.length === 1) {
  const subfolder = entrypoints[0].includes(path.join(outdir, "api"))
    ? "api"
    : "pages";
  outdir = path.join(outdir, subfolder);
}

console.log("🚀  Building your app...\n");

const { success, logs, outputs } = await Bun.build({
  entrypoints,
  outdir,
  root: SRC_DIR,
  minify: true,
  splitting: true,
  plugins: [...(CONFIG.plugins ?? [])],
});

if (!success) {
  logs.forEach((log) => console.error(log));
  process.exit(1);
}

let hasChunk = false;

logTable(
  outputs.map((output) => {
    const route = output.path.replace(outdir, "");
    const isChunk = route.startsWith("/chunk-");
    let symbol = "λ";

    if (isChunk) {
      hasChunk = true;
      symbol = "Φ";
    } else if (route.startsWith("/middleware")) {
      symbol = "ƒ";
    } else if (route.startsWith("/layout")) {
      symbol = "Δ";
    } else if (route.startsWith("/i18n")) {
      symbol = "Ω";
    }

    return {
      Route: `${symbol} ${route}`,
      Size: byteSizeToString(output.size, 0),
    };
  }),
);

console.log("\nλ  Server entry-points");
if (layoutPath) console.log("Δ  Layout");
if (middlewarePath) console.log("ƒ  Middleware");
if (i18nPath) console.log("Ω  i18n");
console.log("Φ  JS shared by all \n");

if (fs.existsSync(inAssetsDir)) {
  // Copy all assets to the build directory
  fs.cpSync(inAssetsDir, outAssetsDir, { recursive: true });

  // Precompress all assets
  await precompressAssets(outAssetsDir).catch(console.error);
}

console.info(`✨  Done in ${(Bun.nanoseconds() / 1000000).toFixed(2)}ms.`);
