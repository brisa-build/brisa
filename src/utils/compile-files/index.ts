import fs from "node:fs";
import path from "node:path";
import { BuildArtifact } from "bun";

import byteSizeToString from "../byte-size-to-string";
import getClientCodeInPage from "../get-client-code-in-page";
import getConstants from "../../constants";
import getEntrypoints from "../get-entrypoints";
import getImportableFilepath from "../get-importable-filepath";
import getRootDir from "../get-root-dir";
import getWebComponentsList from "../get-web-components-list";
import logTable from "../log-table";

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

  const clientSizesPerPage = await compileWebComponents(outdir, outputs);

  if (!clientSizesPerPage) {
    return { success: false, logs: ["Error compiling web components"] };
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

async function compileWebComponents(outdir: string, pages: BuildArtifact[]) {
  const { SRC_DIR } = getConstants();
  const clientCodePath = path.join(outdir, "pages-client");
  const internalPath = path.join(outdir, "_brisa");

  if (!fs.existsSync(clientCodePath)) fs.mkdirSync(clientCodePath);
  if (!fs.existsSync(internalPath)) fs.mkdirSync(internalPath);

  const clientSizesPerPage: Record<string, Blob["size"]> = {};
  const allWebComponents = await getWebComponentsList(SRC_DIR);

  for (const page of pages) {
    const route = page.path.replace(outdir, "");
    const pagePath = path.join(outdir, page.path.replace(outdir, ""));
    const clientCodePath = pagePath.replace("pages", "pages-client");
    const pageCode = await getClientCodeInPage(pagePath, allWebComponents);

    if (!pageCode) return null;

    const { size, code } = pageCode;

    clientSizesPerPage[route] = size;

    if (!code) continue;

    fs.writeFileSync(clientCodePath, code);
  }

  const intrinsicCustomElements = `export interface IntrinsicCustomElements {
  ${Object.entries(allWebComponents)
    .map(
      ([name, location]) =>
        `'${name}': HTMLAttributes<typeof import("${location}")>;`,
    )
    .join("\n")}
}`;

  fs.writeFileSync(
    path.join(internalPath, "types.ts"),
    intrinsicCustomElements,
  );

  return clientSizesPerPage;
}
