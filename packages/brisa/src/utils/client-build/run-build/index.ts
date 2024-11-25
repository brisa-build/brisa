import { getConstants } from '@/constants';
import clientBuildPlugin from '@/utils/client-build-plugin';
import getDefinedEnvVar from '@/utils/get-defined-env-var';
import { shouldTransferTranslatedPagePaths } from '@/utils/transfer-translated-page-paths';
import type { WCs } from '../types';
import { logError } from '@/utils/log/log-build';
import createContextPlugin from '@/utils/create-context/create-context-plugin';

type DepGraph = {
  source: string;
  target: string;
};

// TODO: Adapt to both files, multi-build & single-build (for layout)
// TODO: Solve "define" for entrypoint
//       ... _WEB_CONTEXT_PLUGIN_, _USE_PAGE_TRANSLATION_
// TODO: Test and refactor all this
export async function runBuild(entrypoints: string[], webComponents: WCs) {
  const { IS_PRODUCTION, SRC_DIR, CONFIG, I18N_CONFIG } = getConstants();
  const envVar = getDefinedEnvVar();
  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);
  const webComponentsPath = Object.values(webComponents);
  const depGraph: DepGraph[] = [];
  const entrypointSet = new Set(entrypoints);
  const analysis: Record<string, { useI18n: boolean; i18nKeys: Set<string> }> =
    {};

  function pathToEntrypoint(path: string) {
    if (entrypointSet.has(path)) return path;

    const dependency = depGraph.find((dep) => dep.target === path);
    if (!dependency) return undefined;

    return pathToEntrypoint(dependency.source);
  }

  const buildResult = await Bun.build({
    entrypoints,
    root: SRC_DIR,
    format: 'iife',
    target: 'browser',
    minify: IS_PRODUCTION,
    external: CONFIG.external,
    define: {
      __DEV__: (!IS_PRODUCTION).toString(),
      __WEB_CONTEXT_PLUGINS__: 'false', // useWebContextPlugins.toString(),  (TODO)
      __BASE_PATH__: JSON.stringify(CONFIG.basePath ?? ''),
      __ASSET_PREFIX__: JSON.stringify(CONFIG.assetPrefix ?? ''),
      __TRAILING_SLASH__: Boolean(CONFIG.trailingSlash).toString(),
      __USE_LOCALE__: Boolean(I18N_CONFIG?.defaultLocale).toString(),
      __USE_PAGE_TRANSLATION__: shouldTransferTranslatedPagePaths(
        I18N_CONFIG?.pages,
      ).toString(),
      // For security:
      'import.meta.dirname': '',
      ...envVar,
    },
    plugins: extendPlugins(
      [
        {
          name: 'client-build-plugin',
          setup(build) {
            const filter = new RegExp(
              `(.*/src/web-components/(?!_integrations).*\\.(tsx|jsx|js|ts)|${webComponentsPath
                .join('|')
                // These replaces are to fix the regex in Windows
                .replace(/\\/g, '\\\\')})$`.replace(/\//g, '[\\\\/]'),
            );

            // TODO: Simplify this code after this Bun feature:
            // https://github.com/oven-sh/bun/issues/15003
            build.onResolve({ filter }, (args) => {
              if (!args.importer) return;

              depGraph.push({ source: args.importer, target: args.path });

              return null;
            });

            build.onLoad({ filter }, async ({ path, loader }) => {
              let code = await Bun.file(path).text();

              try {
                const entrypoint = pathToEntrypoint(path);
                const currentAnalysis =
                  entrypoint && analysis[entrypoint]
                    ? analysis[entrypoint]
                    : {
                        useI18n: false,
                        i18nKeys: new Set<string>(),
                      };

                if (entrypoint && !analysis[entrypoint]) {
                  analysis[entrypoint] = currentAnalysis;
                }

                const res = clientBuildPlugin(code, path, {
                  isI18nAdded: currentAnalysis.useI18n,
                  isTranslateCoreAdded: currentAnalysis.i18nKeys.size > 0,
                });
                code = res.code;
                currentAnalysis.useI18n ||= res.useI18n;
                res.i18nKeys.forEach((key) =>
                  currentAnalysis.i18nKeys.add(key),
                );
              } catch (error: any) {
                logError({
                  messages: [
                    `Error transforming web component ${path}`,
                    error?.message,
                  ],
                  stack: error?.stack,
                });
              }

              return {
                contents: code,
                loader,
              };
            });
          },
        },
        createContextPlugin(),
      ],
      {
        dev: !IS_PRODUCTION,
        isServer: false,
      },
    ),
  });

  return {
    ...buildResult,
    analysis,
  };
}
