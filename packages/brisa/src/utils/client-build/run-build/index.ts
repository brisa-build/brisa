import { getConstants } from '@/constants';
import clientBuildPlugin from '@/utils/client-build-plugin';
import getDefinedEnvVar from '@/utils/get-defined-env-var';
import { shouldTransferTranslatedPagePaths } from '@/utils/transfer-translated-page-paths';
import type { WCs } from '../types';
import { logError } from '@/utils/log/log-build';
import createContextPlugin from '@/utils/create-context/create-context-plugin';

export async function runBuild(
  entrypoints: string[],
  webComponents: WCs,
  useWebContextPlugins = false,
) {
  const { IS_PRODUCTION, SRC_DIR, CONFIG, I18N_CONFIG } = getConstants();
  const envVar = getDefinedEnvVar();
  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);
  const webComponentsPath = Object.values(webComponents);

  return await Bun.build({
    entrypoints,
    root: SRC_DIR,
    format: 'iife',
    target: 'browser',
    minify: IS_PRODUCTION,
    external: CONFIG.external,
    define: {
      __DEV__: (!IS_PRODUCTION).toString(),
      __WEB_CONTEXT_PLUGINS__: useWebContextPlugins.toString(),
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

            build.onLoad({ filter }, async ({ path, loader }) => {
              let code = await Bun.file(path).text();

              try {
                code = clientBuildPlugin(code, path);
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
}
