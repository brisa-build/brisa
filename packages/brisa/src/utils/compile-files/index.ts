import { gzipSync, write, type BuildArtifact } from 'bun';
import { brotliCompressSync } from 'node:zlib';
import fs from 'node:fs';
import { join, sep } from 'node:path';

import { getConstants } from '@/constants';
import byteSizeToString from '@/utils/byte-size-to-string';
import getClientCodeInPage from '@/utils/get-client-code-in-page';
import getEntrypoints from '@/utils/get-entrypoints';
import getImportableFilepath from '@/utils/get-importable-filepath';
import getWebComponentsList from '@/utils/get-web-components-list';
import { logTable } from '@/utils/log/log-build';
import serverComponentPlugin from '@/utils/server-component-plugin';
import createContextPlugin from '@/utils/create-context/create-context-plugin';
import getI18nClientMessages from '@/utils/get-i18n-client-messages';
import compileActions from '@/utils/compile-actions';
import generateStaticExport from '@/utils/generate-static-export';
import getWebComponentsPerEntryPoints from '@/utils/ast/get-webcomponents-per-entrypoints';

const TS_REGEX = /\.tsx?$/;

export default async function compileFiles() {
  const {
    SRC_DIR,
    BUILD_DIR,
    CONFIG,
    I18N_CONFIG,
    IS_PRODUCTION,
    LOG_PREFIX,
    IS_STATIC_EXPORT,
  } = getConstants();
  const webComponentsDir = join(SRC_DIR, 'web-components');
  const pagesDir = join(SRC_DIR, 'pages');
  const apiDir = join(SRC_DIR, 'api');
  const pagesEntrypoints = getEntrypoints(pagesDir);
  const apiEntrypoints = getEntrypoints(apiDir);
  const middlewarePath = getImportableFilepath('middleware', SRC_DIR);
  const websocketPath = getImportableFilepath('websocket', SRC_DIR);
  const layoutPath = getImportableFilepath('layout', SRC_DIR);
  const i18nPath = getImportableFilepath('i18n', SRC_DIR);
  const integrationsPath = getImportableFilepath(
    '_integrations',
    webComponentsDir,
  );
  const allWebComponents = await getWebComponentsList(
    SRC_DIR,
    integrationsPath,
  );
  const entrypoints = [...pagesEntrypoints, ...apiEntrypoints];
  const webComponentsPerFile: Record<string, Record<string, string>> = {};
  const dependenciesPerFile = new Map<string, Set<string>>();
  const actionsEntrypoints: string[] = [];
  const define = {
    __DEV__: (!IS_PRODUCTION).toString(),
    __BASE_PATH__: JSON.stringify(CONFIG.basePath),
    __TRAILING_SLASH__: Boolean(CONFIG.trailingSlash).toString(),
    __I18N_LOCALE__: Boolean(I18N_CONFIG?.defaultLocale).toString(),
  };
  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);

  if (middlewarePath) entrypoints.push(middlewarePath);
  if (layoutPath) entrypoints.push(layoutPath);
  if (i18nPath) entrypoints.push(i18nPath);
  if (websocketPath) entrypoints.push(websocketPath);
  if (integrationsPath) entrypoints.push(integrationsPath);

  const { success, logs, outputs } = await Bun.build({
    entrypoints,
    outdir: BUILD_DIR,
    sourcemap: IS_PRODUCTION ? undefined : 'inline',
    root: SRC_DIR,
    // Necessary to use bun:ffi and bun API in server files
    target: 'bun',
    minify: IS_PRODUCTION,
    // splitting: false -> necessary to analyze the server pages
    // for the client build. FIXME: improve this to analyze each
    // server page including the chunks that the page needs.
    splitting: false,
    external: ['brisa', 'brisa/server'],
    define,
    plugins: extendPlugins(
      [
        {
          name: 'server-components',
          setup(build) {
            let actionIdCount = 1;

            build.onLoad(
              { filter: /\.(tsx|jsx|mdx)$/ },
              async ({ path, loader }) => {
                let code = await Bun.file(path).text();

                try {
                  const fileID = `a${actionIdCount}`;
                  const result = serverComponentPlugin(code, {
                    path,
                    allWebComponents,
                    fileID,
                  });
                  if (result.hasActions) {
                    const actionEntrypoint = join(
                      BUILD_DIR,
                      'actions_raw',
                      `${fileID}.${loader}`,
                    );

                    actionsEntrypoints.push(actionEntrypoint);
                    actionIdCount += 1;
                    await Bun.write(actionEntrypoint, result.code);
                  }

                  code = result.code;
                  webComponentsPerFile[path] = result.detectedWebComponents;
                  dependenciesPerFile.set(path, result.dependencies);
                } catch (error) {
                  console.log(LOG_PREFIX.ERROR, `Error transforming ${path}`);
                  console.log(LOG_PREFIX.ERROR, (error as Error).message);
                }

                return {
                  contents: code,
                  loader,
                };
              },
            );
          },
        },
        createContextPlugin(),
      ],
      { dev: !IS_PRODUCTION, isServer: true },
    ),
  });

  if (!success) return { success, logs, pagesSize: {} };

  if (actionsEntrypoints.length) {
    const actionResult = await compileActions({ actionsEntrypoints, define });
    if (!actionResult.success) logs.push(...actionResult.logs);
  }

  const pagesSize = await compileClientCodePage(outputs, {
    allWebComponents,
    webComponentsPerEntrypoint: getWebComponentsPerEntryPoints(
      webComponentsPerFile,
      dependenciesPerFile,
      entrypoints,
    ),
    integrationsPath,
    layoutPath,
  });

  if (!pagesSize) {
    return {
      success: false,
      logs: [
        { message: 'Error compiling web components' } as
          | BuildMessage
          | ResolveMessage,
      ],
      pagesSize,
    };
  }

  if (!IS_PRODUCTION || IS_STATIC_EXPORT) {
    return { success, logs, pagesSize };
  }

  const [generated] = (await generateStaticExport()) ?? [new Map()];

  logTable(
    outputs.flatMap((output) => {
      const route = output.path.replace(BUILD_DIR, '');
      const prerenderedRoutes = generated.get(route) ?? [];
      const isChunk = route.startsWith('/chunk-');
      const isPage = route.startsWith('/pages');
      const isPrerender = prerenderedRoutes.length === 1;
      let symbol = 'λ';

      if (isChunk) {
        symbol = 'Φ';
      } else if (route.startsWith('/middleware')) {
        symbol = 'ƒ';
      } else if (route.startsWith('/layout')) {
        symbol = 'Δ';
      } else if (route.startsWith('/i18n')) {
        symbol = 'Ω';
      } else if (route.startsWith('/websocket')) {
        symbol = 'Ψ';
      } else if (route.startsWith('/web-components/_integrations')) {
        symbol = 'Θ';
      }

      const res = [
        {
          Route: `${isPrerender ? '○' : symbol} ${route.replace('.js', '')}`,
          'JS server': byteSizeToString(isPrerender ? 0 : output.size, 0),
          'JS client (gz)': isPage
            ? byteSizeToString(pagesSize[route] ?? 0, 0, true)
            : '',
        },
      ];

      if (prerenderedRoutes.length > 1) {
        for (const prerenderRoute of prerenderedRoutes) {
          res.push({
            Route: `| ○ ${prerenderRoute.replace('.html', '')}`,
            'JS server': byteSizeToString(0, 0),
            'JS client (gz)': isPage
              ? byteSizeToString(pagesSize[route] ?? 0, 0, true)
              : '',
          });
        }
      }

      return res;
    }),
  );

  console.log(LOG_PREFIX.INFO);
  console.log(LOG_PREFIX.INFO, 'λ  Server entry-points');
  if (layoutPath) console.log(LOG_PREFIX.INFO, 'Δ  Layout');
  if (middlewarePath) console.log(LOG_PREFIX.INFO, 'ƒ  Middleware');
  if (i18nPath) console.log(LOG_PREFIX.INFO, 'Ω  i18n');
  if (generated.size) console.log(LOG_PREFIX.INFO, '○  Prerendered pages');
  if (websocketPath) console.log(LOG_PREFIX.INFO, 'Ψ  Websocket');
  if (integrationsPath) {
    console.log(LOG_PREFIX.INFO, 'Θ  Web components integrations');
    console.log(
      LOG_PREFIX.INFO,
      `\t- client code already included in each page`,
    );
    console.log(LOG_PREFIX.INFO, `\t- server code is used for SSR`);
    console.log(LOG_PREFIX.INFO);
  }
  console.log(LOG_PREFIX.INFO, 'Φ  JS shared by all');
  console.log(LOG_PREFIX.INFO);

  return { success, logs, pagesSize: pagesSize };
}

async function compileClientCodePage(
  pages: BuildArtifact[],
  {
    allWebComponents,
    webComponentsPerEntrypoint,
    integrationsPath,
    layoutPath,
  }: {
    allWebComponents: Record<string, string>;
    webComponentsPerEntrypoint: Record<string, Record<string, string>>;
    integrationsPath?: string | null;
    layoutPath?: string | null;
  },
) {
  const { BUILD_DIR, I18N_CONFIG, IS_PRODUCTION } = getConstants();
  const pagesClientPath = join(BUILD_DIR, 'pages-client');
  const internalPath = join(BUILD_DIR, '_brisa');
  const layoutBuildPath = layoutPath ? getBuildPath(layoutPath) : '';
  const writes = [];

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

  const clientSizesPerPage: Record<string, Blob['size']> = {};
  const layoutWebComponents = webComponentsPerEntrypoint[layoutBuildPath];
  const layoutCode = layoutBuildPath
    ? await getClientCodeInPage({
        pagePath: layoutBuildPath,
        allWebComponents,
        pageWebComponents: layoutWebComponents,
        integrationsPath,
      })
    : null;

  for (const page of pages) {
    const route = page.path.replace(BUILD_DIR, '');
    const pagePath = page.path;
    const isPage = route.startsWith(sep + 'pages' + sep);
    const clientPagePath = pagePath.replace('pages', 'pages-client');
    let pageWebComponents = webComponentsPerEntrypoint[pagePath];

    if (!isPage) continue;

    // It is necessary to add the web components of the layout before
    // having the code of the page because it will add the web components
    // in the following fields: code, size.
    if (layoutWebComponents) {
      pageWebComponents = { ...layoutWebComponents, ...pageWebComponents };
    }

    const pageCode = await getClientCodeInPage({
      pagePath,
      allWebComponents,
      pageWebComponents,
      integrationsPath,
      layoutHasContextProvider: layoutCode?.useContextProvider,
    });

    if (!pageCode) return null;

    let { size, rpc, lazyRPC, code, unsuspense, useI18n, i18nKeys } = pageCode;

    // If there are no actions in the page but there are actions in
    // the layout, then it is as if the page also has actions.
    if (!rpc && layoutCode?.rpc) {
      size += layoutCode.rpc.length;
      rpc = layoutCode.rpc;
    }

    // It is not necessary to increase the size here because this
    // code even if it is necessary to generate it if it does not
    // exist yet, it is not part of the initial size of the page
    // because it is loaded in a lazy way.
    if (!lazyRPC && layoutCode?.lazyRPC) {
      lazyRPC = layoutCode.lazyRPC;
    }

    // If there is no unsuspense in the page but there is unsuspense
    // in the layout, then it is as if the page also has unsuspense.
    if (!unsuspense && layoutCode?.unsuspense) {
      size += layoutCode.unsuspense.length;
      unsuspense = layoutCode.unsuspense;
    }

    // fix i18n when it is not defined in the page but it is defined
    // in the layout
    if (!useI18n && layoutCode?.useI18n) {
      useI18n = layoutCode.useI18n;
    }
    if (layoutCode?.i18nKeys.size) {
      i18nKeys = new Set([...i18nKeys, ...layoutCode.i18nKeys]);
    }

    clientSizesPerPage[route] = size;

    if (!size) continue;

    const hash = Bun.hash(code);
    const clientPage = clientPagePath.replace('.js', `-${hash}.js`);
    clientSizesPerPage[route] = 0;

    // create _unsuspense.js and _unsuspense.txt (list of pages with unsuspense)
    clientSizesPerPage[route] += addExtraChunk(unsuspense, '_unsuspense', {
      pagesClientPath,
      pagePath,
      writes,
    });

    // create _rpc-[versionhash].js and _rpc.txt (list of pages with actions)
    clientSizesPerPage[route] += addExtraChunk(rpc, '_rpc', {
      pagesClientPath,
      pagePath,
      writes,
    });

    // create _rpc-lazy-[versionhash].js
    clientSizesPerPage[route] += addExtraChunk(lazyRPC, '_rpc-lazy', {
      pagesClientPath,
      pagePath,
      skipList: true,
      writes,
    });

    if (!code) continue;

    if (useI18n && i18nKeys.size && I18N_CONFIG?.messages) {
      for (const locale of I18N_CONFIG?.locales ?? []) {
        const i18nPagePath = clientPage.replace('.js', `-${locale}.js`);
        const messages = getI18nClientMessages(locale, i18nKeys);
        const i18nCode = `window.i18nMessages={...window.i18nMessages,...(${JSON.stringify(messages)})};`;

        writes.push(Bun.write(i18nPagePath, i18nCode));

        // Compression in production
        if (IS_PRODUCTION) {
          writes.push(
            Bun.write(
              `${i18nPagePath}.gz`,
              gzipSync(new TextEncoder().encode(i18nCode)),
            ),
          );
          writes.push(
            Bun.write(`${i18nPagePath}.br`, brotliCompressSync(i18nCode)),
          );
        }
      }
    }

    // create page file
    writes.push(
      Bun.write(clientPagePath.replace('.js', '.txt'), hash.toString()),
    );
    writes.push(Bun.write(clientPage, code));

    // Compression in production
    if (IS_PRODUCTION) {
      const gzipClientPage = gzipSync(new TextEncoder().encode(code));

      writes.push(Bun.write(`${clientPage}.gz`, gzipClientPage));
      writes.push(Bun.write(`${clientPage}.br`, brotliCompressSync(code)));
      clientSizesPerPage[route] += gzipClientPage.length;
    }
  }

  const intrinsicCustomElements = `export interface IntrinsicCustomElements {
  ${Object.entries(allWebComponents)
    .map(
      ([name, location]) =>
        `'${name}': JSX.WebComponentAttributes<typeof import("${location}").default>;`,
    )
    .join('\n')}
}`;

  writes.push(
    Bun.write(join(internalPath, 'types.ts'), intrinsicCustomElements),
  );

  // Although on Mac it can work without await, on Windows it does not and it is mandatory
  await Promise.all(writes);

  return clientSizesPerPage;
}

function addExtraChunk(
  code: string,
  filename: string,
  {
    pagesClientPath,
    pagePath,
    skipList = false,
    writes,
  }: {
    pagesClientPath: string;
    pagePath: string;
    skipList?: boolean;
    writes: Promise<any>[];
  },
) {
  const { BUILD_DIR, VERSION_HASH, IS_PRODUCTION } = getConstants();
  const jsFilename = `${filename}-${VERSION_HASH}.js`;

  if (!code) return 0;

  if (!skipList && fs.existsSync(join(pagesClientPath, jsFilename))) {
    const listPath = join(pagesClientPath, `${filename}.txt`);

    writes.push(
      Bun.write(
        listPath,
        `${fs.readFileSync(listPath).toString()}\n${pagePath.replace(BUILD_DIR, '')}`,
      ),
    );

    return 0;
  }

  writes.push(Bun.write(join(pagesClientPath, jsFilename), code));

  if (!skipList) {
    writes.push(
      Bun.write(
        join(pagesClientPath, `${filename}.txt`),
        pagePath.replace(BUILD_DIR, ''),
      ),
    );
  }

  if (IS_PRODUCTION) {
    const gzipUnsuspense = gzipSync(new TextEncoder().encode(code));

    writes.push(
      Bun.write(join(pagesClientPath, `${jsFilename}.gz`), gzipUnsuspense),
    );
    writes.push(
      Bun.write(
        join(pagesClientPath, `${jsFilename}.br`),
        brotliCompressSync(code),
      ),
    );
    return gzipUnsuspense.length;
  }

  return code.length;
}

function getBuildPath(path: string) {
  const { SRC_DIR, BUILD_DIR } = getConstants();
  return path.replace(SRC_DIR, BUILD_DIR).replace(TS_REGEX, '.js');
}
