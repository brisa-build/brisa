import { gzipSync, type BuildArtifact } from "bun";
import fs from "node:fs";
import { join } from "node:path";

import { getConstants } from "@/constants";
import byteSizeToString from "@/utils/byte-size-to-string";
import getClientCodeInPage from "@/utils/get-client-code-in-page";
import getEntrypoints from "@/utils/get-entrypoints";
import getImportableFilepath from "@/utils/get-importable-filepath";
import getWebComponentsList from "@/utils/get-web-components-list";
import { logTable } from "@/utils/log/log-build";
import serverComponentPlugin from "@/utils/server-component-plugin";
import createContextPlugin from "@/utils/create-context/create-context-plugin";
import getI18nClientMessages from "@/utils/get-i18n-client-messages";
import compileActions from "@/utils/compile-actions";

export default async function compileFiles() {
  const {
    SRC_DIR,
    BUILD_DIR,
    CONFIG,
    IS_PRODUCTION,
    LOG_PREFIX,
    IS_STATIC_EXPORT,
  } = getConstants();
  const webComponentsDir = join(SRC_DIR, "web-components");
  const pagesDir = join(SRC_DIR, "pages");
  const apiDir = join(SRC_DIR, "api");
  const pagesEntrypoints = getEntrypoints(pagesDir);
  const apiEntrypoints = getEntrypoints(apiDir);
  const middlewarePath = getImportableFilepath("middleware", SRC_DIR);
  const websocketPath = getImportableFilepath("websocket", SRC_DIR);
  const layoutPath = getImportableFilepath("layout", SRC_DIR);
  const i18nPath = getImportableFilepath("i18n", SRC_DIR);
  const integrationsPath = getImportableFilepath(
    "_integrations",
    webComponentsDir,
  );
  const allWebComponents = await getWebComponentsList(
    SRC_DIR,
    integrationsPath,
  );
  const entrypoints = [...pagesEntrypoints, ...apiEntrypoints];
  const webComponentsPerEntrypoint: Record<string, Record<string, string>> = {};
  const actionsEntrypoints: string[] = [];

  if (middlewarePath) entrypoints.push(middlewarePath);
  if (layoutPath) entrypoints.push(layoutPath);
  if (i18nPath) entrypoints.push(i18nPath);
  if (websocketPath) entrypoints.push(websocketPath);
  if (integrationsPath) entrypoints.push(integrationsPath);

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
        name: "server-components",
        setup(build) {
          let actionIdCount = 1;

          build.onLoad({ filter: /\.(tsx|jsx)$/ }, async ({ path, loader }) => {
            let code = await Bun.file(path).text();

            try {
              const fileID = `a${actionIdCount}`;
              const result = serverComponentPlugin(code, {
                path,
                allWebComponents,
                fileID,
              });
              const buildPath = path
                .replace(SRC_DIR, BUILD_DIR)
                .replace(/\.tsx?$/, ".js");

              if (result.hasActions) {
                const actionEntrypoint = join(
                  BUILD_DIR,
                  "actions_raw",
                  `${fileID}.${loader}`,
                );

                actionsEntrypoints.push(actionEntrypoint);
                actionIdCount += 1;
                await Bun.write(actionEntrypoint, result.code);
              }

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

  if (!success) return { success, logs, pagesSize: {} };

  if (actionsEntrypoints.length) {
    const actionResult = await compileActions({ actionsEntrypoints });
    if (!actionResult.success) logs.push(...actionResult.logs);
  }

  const pagesSize = await compileClientCodePage(outputs, {
    allWebComponents,
    webComponentsPerEntrypoint,
    integrationsPath,
  });

  if (!pagesSize) {
    return {
      success: false,
      logs: ["Error compiling web components"],
      pagesSize,
    };
  }

  if (!IS_PRODUCTION || IS_STATIC_EXPORT) {
    return { success, logs, pagesSize };
  }

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
      } else if (route.startsWith("/web-components/_integrations")) {
        symbol = "Θ";
      }

      return {
        Route: `${symbol} ${route.replace(".js", "")}`,
        "JS server": byteSizeToString(output.size, 0),
        "JS client (gz)": isPage
          ? byteSizeToString(pagesSize[route] ?? 0, 0, true)
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
  if (integrationsPath) {
    console.log(LOG_PREFIX.INFO, "Θ  Web components integrations");
    console.log(
      LOG_PREFIX.INFO,
      `\t- client code already included in each page`,
    );
    console.log(LOG_PREFIX.INFO, `\t- server code is used for SSR`);
    console.log(LOG_PREFIX.INFO);
  }
  console.log(LOG_PREFIX.INFO, "Φ  JS shared by all");
  console.log(LOG_PREFIX.INFO);

  return { success, logs, pagesSize: pagesSize };
}

async function compileClientCodePage(
  pages: BuildArtifact[],
  {
    allWebComponents,
    webComponentsPerEntrypoint,
    integrationsPath,
  }: {
    allWebComponents: Record<string, string>;
    webComponentsPerEntrypoint: Record<string, Record<string, string>>;
    integrationsPath?: string | null;
  },
) {
  const { BUILD_DIR, I18N_CONFIG } = getConstants();
  const pagesClientPath = join(BUILD_DIR, "pages-client");
  const internalPath = join(BUILD_DIR, "_brisa");

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
    const pagePath = page.path;
    const clientPagePath = pagePath.replace("pages", "pages-client");
    const pageCode = await getClientCodeInPage(
      pagePath,
      allWebComponents,
      webComponentsPerEntrypoint[pagePath],
      integrationsPath,
    );

    if (!pageCode) return null;

    const { size, code, unsuspense, actionRPC, useI18n, i18nKeys } = pageCode;

    clientSizesPerPage[route] = size;

    if (!size) continue;

    const hash = Bun.hash(code);
    const clientPage = clientPagePath.replace(".js", `-${hash}.js`);
    const gzipClientPage = gzipSync(new TextEncoder().encode(code));
    clientSizesPerPage[route] = 0;

    // create _unsuspense.js and _unsuspense.txt (list of pages with unsuspense)
    clientSizesPerPage[route] += addExtraChunk(unsuspense, "_unsuspense", {
      pagesClientPath,
      pagePath,
    });

    // create _action-[versionhash].js and _action.txt (list of pages with actions)
    clientSizesPerPage[route] += addExtraChunk(actionRPC, "_action", {
      pagesClientPath,
      pagePath,
    });

    if (!code) continue;

    // create i18n page content files
    if (useI18n && i18nKeys.size && I18N_CONFIG?.messages) {
      for (let locale of I18N_CONFIG?.locales ?? []) {
        const i18nPagePath = clientPage.replace(".js", `-${locale}.js`);
        const messages = getI18nClientMessages(locale, i18nKeys);
        const i18nCode = `window.i18nMessages=${JSON.stringify(messages)};`;

        Bun.write(i18nPagePath, i18nCode);
        Bun.write(
          `${i18nPagePath}.gz`,
          gzipSync(new TextEncoder().encode(i18nCode)),
        );
      }
    }

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

  Bun.write(join(internalPath, "types.ts"), intrinsicCustomElements);

  return clientSizesPerPage;
}

function addExtraChunk(
  code: string,
  filename: string,
  { pagesClientPath, pagePath }: { pagesClientPath: string; pagePath: string },
) {
  const { BUILD_DIR, VERSION_HASH } = getConstants();
  const jsFilename = `${filename}-${VERSION_HASH}.js`;

  if (!code) return 0;

  if (fs.existsSync(join(pagesClientPath, jsFilename))) {
    const listPath = join(pagesClientPath, `${filename}.txt`);

    Bun.write(
      listPath,
      `${fs.readFileSync(listPath).toString()}\n${pagePath.replace(
        BUILD_DIR,
        "",
      )}`,
    );

    return 0;
  }

  const gzipUnsuspense = gzipSync(new TextEncoder().encode(code));

  Bun.write(join(pagesClientPath, jsFilename), code);
  Bun.write(join(pagesClientPath, `${jsFilename}.gz`), gzipUnsuspense);
  Bun.write(
    join(pagesClientPath, `${filename}.txt`),
    pagePath.replace(BUILD_DIR, ""),
  );

  return gzipUnsuspense.length;
}
