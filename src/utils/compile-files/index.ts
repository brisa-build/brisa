import { gzipSync, type BuildArtifact } from "bun";
import fs from "node:fs";
import path from "node:path";

import getConstants from "@/constants";
import byteSizeToString from "@/utils/byte-size-to-string";
import getClientCodeInPage from "@/utils/get-client-code-in-page";
import getEntrypoints from "@/utils/get-entrypoints";
import getImportableFilepath from "@/utils/get-importable-filepath";
import getWebComponentsList from "@/utils/get-web-components-list";
import { logTable } from "@/utils/log/log-build";
import ssrWebComponentPlugin from "@/utils/ssr-web-component/ssr-web-component-plugin";
import createContextPlugin from "@/utils/create-context/create-context-plugin";

export default async function compileFiles() {
  const { SRC_DIR, BUILD_DIR, CONFIG, IS_PRODUCTION, LOG_PREFIX } =
    getConstants();
  const pagesDir = path.join(SRC_DIR, "pages");
  const apiDir = path.join(SRC_DIR, "api");
  const pagesEntrypoints = getEntrypoints(pagesDir);
  const apiEntrypoints = getEntrypoints(apiDir);
  const middlewarePath = getImportableFilepath("middleware", SRC_DIR);
  const websocketPath = getImportableFilepath("websocket", SRC_DIR);
  const layoutPath = getImportableFilepath("layout", SRC_DIR);
  const i18nPath = getImportableFilepath("i18n", SRC_DIR);
  const allWebComponents = await getWebComponentsList(SRC_DIR);
  const entrypoints = [...pagesEntrypoints, ...apiEntrypoints];
  const webComponentsPerEntrypoint: Record<string, Record<string, string>> = {};

  if (middlewarePath) entrypoints.push(middlewarePath);
  if (layoutPath) entrypoints.push(layoutPath);
  if (i18nPath) entrypoints.push(i18nPath);
  if (websocketPath) entrypoints.push(websocketPath);

  const { success, logs, outputs } = await Bun.build({
    entrypoints,
    outdir: BUILD_DIR,
    sourcemap: IS_PRODUCTION ? undefined : "inline",
    root: SRC_DIR,
    // Necessary to use bun:ffi and bun API in server files
    target: "bun",
    minify: IS_PRODUCTION,
    splitting: true,
    plugins: [
      {
        name: "ssr-web-components",
        setup(build) {
          build.onLoad({ filter: /\.(tsx|jsx)$/ }, async ({ path, loader }) => {
            let code = await Bun.file(path).text();

            try {
              const result = ssrWebComponentPlugin(code, allWebComponents);
              const buildPath = path
                .replace(SRC_DIR, BUILD_DIR)
                .replace(/\.tsx?$/, ".js");
              code = result.code;
              webComponentsPerEntrypoint[buildPath] =
                result.detectedWebComponents;
            } catch (error) {
              console.log(LOG_PREFIX.ERROR, `Error transforming ${path}`);
              console.log(LOG_PREFIX.ERROR, (error as Error).message);
            }

            return {
              contents: code,
              loader,
            };
          });
        },
      },
      createContextPlugin(),
      ...(CONFIG?.plugins ?? []),
    ],
  });

  if (!success) return { success, logs };

  const clientSizesPerPage = await compileClientCodePage(
    outputs,
    allWebComponents,
    webComponentsPerEntrypoint,
  );

  if (!clientSizesPerPage) {
    return { success: false, logs: ["Error compiling web components"] };
  }

  if (!IS_PRODUCTION) return { success, logs };

  logTable(
    outputs.map((output) => {
      const route = output.path.replace(BUILD_DIR, "");
      const isChunk = route.startsWith("/chunk-");
      const isPage = route.startsWith("/pages");
      let symbol = "λ";

      if (isChunk) {
        symbol = "Φ";
      } else if (route.startsWith("/middleware")) {
        symbol = "ƒ";
      } else if (route.startsWith("/layout")) {
        symbol = "Δ";
      } else if (route.startsWith("/i18n")) {
        symbol = "Ω";
      } else if (route.startsWith("/websocket")) {
        symbol = "Ψ";
      }

      return {
        Route: `${symbol} ${route}`,
        "JS server": byteSizeToString(output.size, 0),
        "JS client (gz)": isPage
          ? byteSizeToString(clientSizesPerPage[route] ?? 0, 0, true)
          : "",
      };
    }),
  );

  console.log(LOG_PREFIX.INFO);
  console.log(LOG_PREFIX.INFO, "λ  Server entry-points");
  if (layoutPath) console.log(LOG_PREFIX.INFO, "Δ  Layout");
  if (middlewarePath) console.log(LOG_PREFIX.INFO, "ƒ  Middleware");
  if (i18nPath) console.log(LOG_PREFIX.INFO, "Ω  i18n");
  if (websocketPath) console.log(LOG_PREFIX.INFO, "Ψ  Websocket");
  console.log(LOG_PREFIX.INFO, "Φ  JS shared by all");
  console.log(LOG_PREFIX.INFO);

  return { success, logs };
}

async function compileClientCodePage(
  pages: BuildArtifact[],
  allWebComponents: Record<string, string>,
  webComponentsPerEntrypoint: Record<string, Record<string, string>>,
) {
  const { BUILD_DIR } = getConstants();
  const pagesClientPath = path.join(BUILD_DIR, "pages-client");
  const internalPath = path.join(BUILD_DIR, "_brisa");

  // During hotreloading it is important to clean pages-client because
  // new client files are generated with hash, this hash can change
  // and many files would be accumulated during development.
  //
  // On the other hand, in production it will always be empty because
  // the whole build is cleaned at startup.
  if (fs.existsSync(pagesClientPath)) {
    fs.rmSync(pagesClientPath, { recursive: true });
  }
  // Create pages-client
  fs.mkdirSync(pagesClientPath);

  if (!fs.existsSync(internalPath)) fs.mkdirSync(internalPath);

  const clientSizesPerPage: Record<string, Blob["size"]> = {};

  for (const page of pages) {
    const route = page.path.replace(BUILD_DIR, "");
    const pagePath = path.join(BUILD_DIR, page.path.replace(BUILD_DIR, ""));
    const clientPagePath = pagePath.replace("pages", "pages-client");
    const pageCode = await getClientCodeInPage(
      pagePath,
      allWebComponents,
      webComponentsPerEntrypoint[pagePath],
    );

    if (!pageCode) return null;

    const { size, code, unsuspense } = pageCode;

    clientSizesPerPage[route] = size;

    if (!size) continue;

    const hash = Bun.hash(code);
    const clientPage = clientPagePath.replace(".js", `-${hash}.js`);
    const gzipClientPage = gzipSync(new TextEncoder().encode(code));
    clientSizesPerPage[route] = 0;

    // create _unsuspense.js and _unsuspense.txt (list of pages with unsuspense)
    if (
      unsuspense &&
      !fs.existsSync(path.join(pagesClientPath, "_unsuspense.js"))
    ) {
      const gzipUnsuspense = gzipSync(new TextEncoder().encode(unsuspense));

      clientSizesPerPage[route] += gzipUnsuspense.length;
      Bun.write(path.join(pagesClientPath, "_unsuspense.js"), unsuspense);
      Bun.write(
        path.join(pagesClientPath, "_unsuspense.js.gz"),
        gzipUnsuspense,
      );
      Bun.write(
        path.join(pagesClientPath, "_unsuspense.txt"),
        pagePath.replace(BUILD_DIR, ""),
      );
    }

    // register page route to _unsuspense.txt
    else if (unsuspense) {
      const unsuspenseListPath = path.join(pagesClientPath, "_unsuspense.txt");
      const unsuspenseText = fs.readFileSync(unsuspenseListPath).toString();

      Bun.write(
        unsuspenseListPath,
        `${unsuspenseText}\n${pagePath.replace(BUILD_DIR, "")}`,
      );
    }

    if (!code) continue;

    // create page file
    Bun.write(clientPagePath.replace(".js", ".txt"), hash.toString());
    Bun.write(clientPage, code);
    Bun.write(`${clientPage}.gz`, gzipClientPage);
    clientSizesPerPage[route] += gzipClientPage.length;
  }

  const intrinsicCustomElements = `export interface IntrinsicCustomElements {
  ${Object.entries(allWebComponents)
    .map(
      ([name, location]) =>
        `'${name}': JSX.WebComponentAttributes<typeof import("${location}").default>;`,
    )
    .join("\n")}
}`;

  Bun.write(path.join(internalPath, "types.ts"), intrinsicCustomElements);

  return clientSizesPerPage;
}
