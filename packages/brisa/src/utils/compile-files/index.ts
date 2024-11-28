import { join } from 'node:path';

import { getConstants } from '@/constants';
import byteSizeToString from '@/utils/byte-size-to-string';
import getEntrypoints, { getEntrypointsRouter } from '@/utils/get-entrypoints';
import getImportableFilepath from '@/utils/get-importable-filepath';
import getWebComponentsList from '@/utils/get-web-components-list';
import { log, logTable } from '@/utils/log/log-build';
import serverComponentPlugin from '@/utils/server-component-plugin';
import createContextPlugin from '@/utils/create-context/create-context-plugin';
import { transpileActions, buildActions } from '@/utils/transpile-actions';
import generateStaticExport from '@/utils/generate-static-export';
import getWebComponentsPerEntryPoints from '@/utils/get-webcomponents-per-entrypoints';
import { shouldTransferTranslatedPagePaths } from '@/utils/transfer-translated-page-paths';
import { clientBuild } from '../client-build';

const BRISA_DEPS = ['brisa/server'];

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
  const isNode = CONFIG.output === 'node' && IS_PRODUCTION;
  const webComponentsDir = join(SRC_DIR, 'web-components');
  const pagesDir = join(SRC_DIR, 'pages');
  const apiDir = join(SRC_DIR, 'api');
  const pagesRoutes = getEntrypointsRouter(pagesDir);
  const pagesEntrypoints = pagesRoutes.routes.map((a) => a[1]);
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
    __BASE_PATH__: JSON.stringify(CONFIG.basePath ?? ''),
    __ASSET_PREFIX__: JSON.stringify(CONFIG.assetPrefix ?? ''),
    __TRAILING_SLASH__: Boolean(CONFIG.trailingSlash).toString(),
    __USE_LOCALE__: Boolean(I18N_CONFIG?.defaultLocale).toString(),
    __USE_PAGE_TRANSLATION__: shouldTransferTranslatedPagePaths(
      I18N_CONFIG?.pages,
    ).toString(),
  };
  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);
  const external = CONFIG.external
    ? [...CONFIG.external, ...BRISA_DEPS]
    : BRISA_DEPS;

  if (middlewarePath) entrypoints.push(middlewarePath);
  if (layoutPath) entrypoints.push(layoutPath);
  if (i18nPath) entrypoints.push(i18nPath);
  if (websocketPath) entrypoints.push(websocketPath);
  if (integrationsPath) entrypoints.push(integrationsPath);

  log(LOG_PREFIX.WAIT, `compiling ${entrypoints.length} server entrypoints...`);

  const actionWrites: Promise<number>[] = [];
  const { success, logs, outputs } = await Bun.build({
    entrypoints,
    outdir: BUILD_DIR,
    sourcemap: IS_PRODUCTION ? undefined : 'inline',
    root: SRC_DIR,
    target: isNode ? 'node' : 'bun',
    minify: IS_PRODUCTION,
    // splitting: false -> necessary to analyze the server pages
    // for the client build. FIXME: improve this to analyze each
    // server page including the chunks that the page needs.
    splitting: false,
    external,
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
                  const fileID = `a${Bun.hash(path).toString(36)}`;
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
                    actionWrites.push(
                      Bun.write(
                        actionEntrypoint,
                        transpileActions(result.code),
                      ),
                    );
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
    const actionResult = await Promise.all(actionWrites).then(() =>
      buildActions({ actionsEntrypoints, define }),
    );
    if (!actionResult.success) logs.push(...actionResult.logs);
  }

  const pagesSize = await clientBuild(outputs, {
    allWebComponents,
    webComponentsPerEntrypoint: getWebComponentsPerEntryPoints(
      webComponentsPerFile,
      dependenciesPerFile,
      entrypoints,
    ),
    integrationsPath,
    layoutPath,
    pagesRoutes,
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

      // Do not show assets in the table (css files)
      if (route.endsWith('.css')) {
        return [];
      }

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
