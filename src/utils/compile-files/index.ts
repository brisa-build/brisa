import path from "node:path";
import fs from "node:fs";
import getConstants from "../../constants";
import getEntrypoints from "../get-entrypoints";
import getImportableFilepath from "../get-importable-filepath";
import getRootDir from "../get-root-dir";
import logTable from "../log-table";
import byteSizeToString from "../byte-size-to-string";
import getClientCodeInPage from "../get-client-code-in-page";

export default async function compileFiles(
  outdir = path.join(getRootDir(), "build"),
) {
  const { SRC_DIR, CONFIG, IS_PRODUCTION, LOG_PREFIX } = getConstants();
  const pagesDir = path.join(SRC_DIR, "pages");
  const apiDir = path.join(SRC_DIR, "api");
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

  const { success, logs, outputs } = await Bun.build({
    entrypoints,
    outdir,
    sourcemap: IS_PRODUCTION ? undefined : "inline",
    root: SRC_DIR,
    minify: true,
    splitting: true,
    plugins: [...(CONFIG?.plugins ?? [])],
  });

  if (!success) return { success, logs };

  fs.mkdirSync(path.join(outdir, "pages-client"));

  const clientSizesPerPage: Record<string, Blob["size"]> = {};

  for (const output of outputs) {
    const route = output.path.replace(outdir, "");
    const pagePath = path.join(outdir, output.path.replace(outdir, ""));
    const clientCodePath = pagePath.replace("pages", "pages-client");
    const pageCode = await getClientCodeInPage(pagePath);

    if (!pageCode)
      return { success: false, logs: [`Error compiling ${route}`] };

    const { size, code } = pageCode;

    clientSizesPerPage[route] = size;

    if (!code) continue;

    fs.writeFileSync(clientCodePath, code);
  }

  if (!IS_PRODUCTION) return { success, logs };

  logTable(
    outputs.map((output) => {
      const route = output.path.replace(outdir, "");
      const isChunk = route.startsWith("/chunk-");
      let symbol = "λ";

      if (isChunk) {
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
        "Client size": byteSizeToString(clientSizesPerPage[route] ?? 0, 0),
      };
    }),
  );

  console.log(LOG_PREFIX.INFO);
  console.log(LOG_PREFIX.INFO, "λ  Server entry-points");
  if (layoutPath) console.log(LOG_PREFIX.INFO, "Δ  Layout");
  if (middlewarePath) console.log(LOG_PREFIX.INFO, "ƒ  Middleware");
  if (i18nPath) console.log(LOG_PREFIX.INFO, "Ω  i18n");
  console.log(LOG_PREFIX.INFO, "Φ  JS shared by all");
  console.log(LOG_PREFIX.INFO);

  return { success, logs };
}
