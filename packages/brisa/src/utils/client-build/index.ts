import { sep } from 'node:path';
import { getConstants } from '@/constants';
import type { BuildArtifact } from 'bun';
import getDefinedEnvVar from '../get-defined-env-var';
import { shouldTransferTranslatedPagePaths } from '../transfer-translated-page-paths';
import clientBuildPlugin from '../client-build-plugin';
import { logBuildError, logError } from '../log/log-build';
import createContextPlugin from '../create-context/create-context-plugin';
import { preEntrypointAnalysis } from './pre-entrypoint-analysis';
import {
  removeTempEntrypoints,
  writeTempEntrypoint,
} from './fs-temp-entrypoint-manager';

type WCs = Record<string, string>;
type WCsEntrypoints = Record<string, WCs>;

type Options = {
  webComponentsPerEntrypoint: WCsEntrypoints;
  layoutWebComponents: WCs;
  allWebComponents: WCs;
  integrationsPath?: string | null;
  layoutHasContextProvider?: boolean;
};

export default async function getClientBuildDetails(
  pages: BuildArtifact[],
  options: Options,
) {
  const { IS_PRODUCTION, SRC_DIR, CONFIG, I18N_CONFIG } = getConstants();
  let clientBuildDetails = (
    await Promise.all(pages.map((p) => prepareEntrypoint(p, options)))
  ).filter(Boolean) as EntryPointData[];

  const entrypointsData = clientBuildDetails.reduce((acc, curr, index) => {
    if (curr.entrypoint) acc.push({ ...curr, index });
    return acc;
  }, [] as EntryPointData[]);

  const entrypoints = entrypointsData.map((p) => p.entrypoint!);
  const envVar = getDefinedEnvVar();
  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);
  const webComponentsPath = Object.values(options.allWebComponents);

  if (entrypoints.length === 0) {
    return clientBuildDetails;
  }

  const { success, logs, outputs } = await Bun.build({
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
                    isI18nAdded: true, // useI18n, (TODO)
                    isTranslateCoreAdded: true, // i18nKeys.size > 0, (TODO)
                  });
                  code = res.code;
                  // useI18n ||= res.useI18n; (TODO)
                  // i18nKeys = new Set([...i18nKeys, ...res.i18nKeys]); (TODO)
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
      {
        dev: !IS_PRODUCTION,
        isServer: false,
        /* entrypoint: pagePath (TODO: change docs about this) */
      } as any, // TODO: Fix types
    ),
  });

  // TODO: Adapt plugin to analyze per entrypoint
  // TODO: Solve "define" for entrypoint
  //       ... _WEB_CONTEXT_PLUGIN_, _USE_PAGE_TRANSLATION_
  // TODO: Create build with all the temporal pages
  // TODO: How to solve the layout web components?
  // TODO: Save outputs to correct paths
  // TODO: Write the new outputs to the disk and cleanup the temporal pages
  // TODO: Overwrite clientBuildDetails with code, size
  // TODO: Test and refactor all this
  // TODO: Benchmarks old vs new

  // Remove all temp files
  await removeTempEntrypoints(entrypoints);

  if (!success) {
    logBuildError('Failed to compile web components', logs);
    return clientBuildDetails;
  }

  for (let i = 0; i < outputs.length; i++) {
    const index = entrypointsData[i].index!;
    clientBuildDetails[index].code = await outputs[i].text();
    clientBuildDetails[index].size = outputs[i].size;
  }

  return clientBuildDetails;
}

type EntryPointData = {
  unsuspense: string;
  rpc: string;
  useContextProvider: boolean;
  lazyRPC: string;
  size: number;
  useI18n: boolean;
  i18nKeys: Set<string>;
  code: string;
  entrypoint?: string;
  useWebContextPlugins?: boolean;
  pagePath: string;
  index?: number;
};

async function prepareEntrypoint(
  page: BuildArtifact,
  {
    allWebComponents,
    webComponentsPerEntrypoint,
    layoutWebComponents,
    integrationsPath,
    layoutHasContextProvider,
  }: Options,
): Promise<EntryPointData | undefined> {
  const { BUILD_DIR } = getConstants();
  const route = page.path.replace(BUILD_DIR, '');
  const pagePath = page.path;
  const isPage = route.startsWith(sep + 'pages' + sep);

  if (!isPage) return;

  const wcs = webComponentsPerEntrypoint[pagePath] ?? {};
  const pageWebComponents = layoutWebComponents
    ? { ...layoutWebComponents, ...wcs }
    : wcs;

  const analysis = await preEntrypointAnalysis(
    pagePath,
    allWebComponents,
    pageWebComponents,
    layoutHasContextProvider,
  );

  if (!Object.keys(analysis.webComponents).length) return analysis;

  const { entrypoint, useWebContextPlugins } = await writeTempEntrypoint({
    webComponentsList: analysis.webComponents,
    useContextProvider: analysis.useContextProvider,
    integrationsPath,
    pagePath,
  });

  return { ...analysis, entrypoint, useWebContextPlugins };
}
