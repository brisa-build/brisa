import { getConstants } from '@/constants';
import clientBuildPlugin from '@/utils/client-build-plugin';
import createContextPlugin from '@/utils/create-context/create-context-plugin';
import { logBuildError, logError } from '@/utils/log/log-build';
import { shouldTransferTranslatedPagePaths } from '@/utils/transfer-translated-page-paths';
import getDefinedEnvVar from '../get-defined-env-var';
import { preEntrypointAnalysis } from '../client-build/pre-entrypoint-analysis';
import {
  removeTempEntrypoint,
  writeTempEntrypoint,
} from '../client-build/fs-temp-entrypoint-manager';

type TransformOptions = {
  webComponentsList: Record<string, string>;
  useContextProvider: boolean;
  integrationsPath?: string | null;
  pagePath: string;
};

type ClientCodeInPageProps = {
  pagePath: string;
  allWebComponents?: Record<string, string>;
  pageWebComponents?: Record<string, string>;
  integrationsPath?: string | null;
  layoutHasContextProvider?: boolean;
};

export default async function getClientCodeInPage({
  pagePath,
  allWebComponents = {},
  pageWebComponents = {},
  integrationsPath,
  layoutHasContextProvider,
}: ClientCodeInPageProps) {
  const analysis = await preEntrypointAnalysis(
    pagePath,
    allWebComponents,
    pageWebComponents,
    layoutHasContextProvider,
  );

  if (!Object.keys(analysis.webComponents).length) {
    return analysis;
  }

  const transformedCode = await transformToWebComponents({
    webComponentsList: analysis.webComponents,
    useContextProvider: analysis.useContextProvider,
    integrationsPath,
    pagePath,
  });

  if (!transformedCode) return null;

  return {
    code: analysis.code + transformedCode?.code,
    unsuspense: analysis.unsuspense,
    rpc: analysis.rpc,
    useContextProvider: analysis.useContextProvider,
    lazyRPC: analysis.lazyRPC,
    size: analysis.size + (transformedCode?.size ?? 0),
    useI18n: transformedCode.useI18n,
    i18nKeys: transformedCode.i18nKeys,
  };
}

export async function transformToWebComponents({
  webComponentsList,
  useContextProvider,
  integrationsPath,
  pagePath,
}: TransformOptions) {
  const { SRC_DIR, CONFIG, I18N_CONFIG, IS_PRODUCTION } = getConstants();

  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);
  let useI18n = false;
  let i18nKeys = new Set<string>();
  const webComponentsPath = Object.values(webComponentsList);

  const { entrypoint, useWebContextPlugins } = await writeTempEntrypoint({
    webComponentsList,
    useContextProvider,
    integrationsPath,
    pagePath,
  });

  const envVar = getDefinedEnvVar();

  const { success, logs, outputs } = await Bun.build({
    entrypoints: [entrypoint],
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
            build.onLoad(
              {
                filter: new RegExp(
                  `(.*/src/web-components/(?!_integrations).*\\.(tsx|jsx|js|ts)|${webComponentsPath
                    .join('|')
                    // These replaces are to fix the regex in Windows
                    .replace(/\\/g, '\\\\')})$`.replace(/\//g, '[\\\\/]'),
                ),
              },
              async ({ path, loader }) => {
                let code = await Bun.file(path).text();

                try {
                  const res = clientBuildPlugin(code, path, {
                    isI18nAdded: useI18n,
                    isTranslateCoreAdded: i18nKeys.size > 0,
                  });
                  code = res.code;
                  useI18n ||= res.useI18n;
                  i18nKeys = new Set([...i18nKeys, ...res.i18nKeys]);
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
              },
            );
          },
        },
        createContextPlugin(),
      ],
      { dev: !IS_PRODUCTION, isServer: false, entrypoint: pagePath },
    ),
  });

  await removeTempEntrypoint(entrypoint);

  if (!success) {
    logBuildError('Failed to compile web components', logs);
    return null;
  }

  return {
    code: await outputs[0].text(),
    size: outputs[0].size,
    useI18n,
    i18nKeys,
  };
}
