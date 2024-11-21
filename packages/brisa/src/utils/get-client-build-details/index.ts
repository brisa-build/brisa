import { sep } from 'node:path';
import { join } from 'node:path';
import { writeFile, rm } from 'node:fs/promises';
import { getConstants } from '@/constants';
import type { BuildArtifact } from 'bun';
import AST from '../ast';
import analyzeServerAst from '../analyze-server-ast';
import { getFilterDevRuntimeErrors } from '@/utils/brisa-error-dialog/utils';
import snakeToCamelCase from '@/utils/snake-to-camelcase';
import { injectUnsuspenseCode } from '@/utils/inject-unsuspense-code' with {
  type: 'macro',
};
import {
  injectRPCCode,
  injectRPCCodeForStaticApp,
  injectRPCLazyCode,
} from '@/utils/rpc' with { type: 'macro' };
import { injectClientContextProviderCode } from '@/utils/context-provider/inject-client' with {
  type: 'macro',
};
import { injectBrisaDialogErrorCode } from '@/utils/brisa-error-dialog/inject-code' with {
  type: 'macro',
};
import getDefinedEnvVar from '../get-defined-env-var';
import { shouldTransferTranslatedPagePaths } from '../transfer-translated-page-paths';
import clientBuildPlugin from '../client-build-plugin';
import { logBuildError, logError } from '../log/log-build';
import createContextPlugin from '../create-context/create-context-plugin';

type WCs = Record<string, string>;
type WCsEntrypoints = Record<string, WCs>;

type Options = {
  webComponentsPerEntrypoint: WCsEntrypoints;
  layoutWebComponents: WCs;
  allWebComponents: WCs;
  integrationsPath?: string | null;
};

const ASTUtil = AST('tsx');
const unsuspenseScriptCode = injectUnsuspenseCode() as unknown as string;
const RPCLazyCode = injectRPCLazyCode() as unknown as string;

export default async function getClientBuildDetails(
  pages: BuildArtifact[],
  options: Options,
) {
  const { IS_PRODUCTION, SRC_DIR, CONFIG, I18N_CONFIG } = getConstants();
  let clientBuildDetails = (
    await Promise.all(pages.map((p) => prepareEntrypoint(p, options)))
  ).filter((p) => p?.entrypoint) as EntryPointData[];

  const entrypoints = clientBuildDetails.map((p) => p.entrypoint!);
  const envVar = getDefinedEnvVar();
  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);
  const webComponentsPath = Object.values(options.allWebComponents);

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
  // TODO: Com resoldré els defines que son per entrypoint?
  //       ... _WEB_CONTEXT_PLUGIN_, _USE_PAGE_TRANSLATION_
  // TODO: Create build with all the temporal pages
  // TODO: Save outputs to correct paths
  // TODO: Write the new outputs to the disk and cleanup the temporal pages
  // TODO: Overwrite clientBuildDetails with code, size
  // TODO: Test and refactor all this
  // TODO: Benchmarks old vs new

  // Remove all temp files
  await Promise.all(entrypoints.map((e) => rm(e)));

  if (!success) {
    logBuildError('Failed to compile web components', logs);
    return clientBuildDetails;
  }

  for (let i = 0; i < outputs.length; i++) {
    clientBuildDetails[i].code = await outputs[i].text();
    clientBuildDetails[i].size = outputs[i].size;
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
};

async function prepareEntrypoint(
  page: BuildArtifact,
  {
    allWebComponents,
    webComponentsPerEntrypoint,
    layoutWebComponents,
    integrationsPath,
  }: Options,
): Promise<EntryPointData | undefined> {
  const { BUILD_DIR } = getConstants();
  const route = page.path.replace(BUILD_DIR, '');
  const pagePath = page.path;
  const isPage = route.startsWith(sep + 'pages' + sep);

  if (!isPage) return;

  const webComponents = webComponentsPerEntrypoint[pagePath] ?? {};
  const pageWebComponents = layoutWebComponents
    ? { ...layoutWebComponents, ...webComponents }
    : webComponents;
  const ast = await getAstFromPath(pagePath);
  let size = 0;
  let { useSuspense, useContextProvider, useActions, useHyperlink } =
    // TODO: Remove layoutHasContextProvider as param and do it in a diferent way
    analyzeServerAst(ast, allWebComponents);

  // Web components inside web components
  const nestedComponents = await Promise.all(
    Object.values(pageWebComponents).map(async (path) =>
      analyzeServerAst(await getAstFromPath(path), allWebComponents),
    ),
  );

  for (const item of nestedComponents) {
    useContextProvider ||= item.useContextProvider;
    useSuspense ||= item.useSuspense;
    useHyperlink ||= item.useHyperlink;
    Object.assign(pageWebComponents, item.webComponents);
  }

  const unsuspense = useSuspense ? unsuspenseScriptCode : '';
  const rpc = useActions || useHyperlink ? getRPCCode() : '';
  const lazyRPC = useActions || useHyperlink ? RPCLazyCode : '';

  size += unsuspense.length;
  size += rpc.length;

  const res = {
    unsuspense,
    rpc,
    useContextProvider,
    lazyRPC,
    size,
    useI18n: false,
    i18nKeys: new Set<string>(),
    code: '',
    pagePath,
  };

  // No client build needed, TODO: We need to return the data?!
  if (!Object.keys(pageWebComponents).length) return res;

  const { entrypoint, useWebContextPlugins } = await writeEntrypoint({
    webComponentsList: pageWebComponents,
    useContextProvider,
    integrationsPath,
    pagePath,
  });

  return { ...res, entrypoint, useWebContextPlugins };
}

async function getAstFromPath(path: string) {
  return ASTUtil.parseCodeToAST(
    path[0] === '{' ? '' : await Bun.file(path).text(),
  );
}

function getRPCCode() {
  const { IS_PRODUCTION, IS_STATIC_EXPORT } = getConstants();
  return (IS_STATIC_EXPORT && IS_PRODUCTION
    ? injectRPCCodeForStaticApp()
    : injectRPCCode()) as unknown as string;
}

type TransformOptions = {
  webComponentsList: Record<string, string>;
  useContextProvider: boolean;
  integrationsPath?: string | null;
  pagePath: string;
};

async function writeEntrypoint({
  webComponentsList,
  useContextProvider,
  integrationsPath,
  pagePath,
}: TransformOptions) {
  const { IS_DEVELOPMENT } = getConstants();
  const webEntrypoint = getTempFileName(pagePath);
  let useWebContextPlugins = false;
  const entries = Object.entries(webComponentsList);

  // Note: JS imports in Windows have / instead of \, so we need to replace it
  // Note: Using "require" for component dependencies not move the execution
  // on top avoiding missing global variables as window._P
  let imports = entries
    .map(([name, path]) =>
      path[0] === '{'
        ? `require("${normalizePath(path)}");`
        : `import ${snakeToCamelCase(name)} from "${path.replaceAll(sep, '/')}";`,
    )
    .join('\n');

  // Add web context plugins import only if there is a web context plugin
  if (integrationsPath) {
    const module = await import(integrationsPath);
    if (module.webContextPlugins?.length > 0) {
      useWebContextPlugins = true;
      imports += `import {webContextPlugins} from "${integrationsPath}";`;
    }
  }

  const defineElement =
    'const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);';

  const customElementKeys = entries
    .filter(([_, path]) => path[0] !== '{')
    .map(([k]) => k);

  if (useContextProvider) {
    customElementKeys.unshift('context-provider');
  }

  if (IS_DEVELOPMENT) {
    customElementKeys.unshift('brisa-error-dialog');
  }

  const customElementsDefinitions = customElementKeys
    .map((k) => `defineElement("${k}", ${snakeToCamelCase(k)});`)
    .join('\n');

  let code = '';

  if (useContextProvider) {
    const contextProviderCode =
      injectClientContextProviderCode() as unknown as string;
    code += contextProviderCode;
  }

  // IS_DEVELOPMENT to avoid PROD and TEST environments
  if (IS_DEVELOPMENT) {
    const brisaDialogErrorCode = (await injectBrisaDialogErrorCode()).replace(
      '__FILTER_DEV_RUNTIME_ERRORS__',
      getFilterDevRuntimeErrors(),
    );
    code += brisaDialogErrorCode;
  }

  // Inject web context plugins to window to be used inside web components
  if (useWebContextPlugins) {
    code += 'window._P=webContextPlugins;\n';
  }

  code += `${imports}\n`;
  code += `${defineElement}\n${customElementsDefinitions};`;

  await writeFile(webEntrypoint, code);

  return { entrypoint: webEntrypoint, useWebContextPlugins };
}

function getTempFileName(pagePath: string) {
  const { PAGES_DIR, BUILD_DIR } = getConstants();
  const tempName = pagePath
    .replace(PAGES_DIR, '')
    .replaceAll(sep, '-')
    .replace(/\.[a-z]+$/, '');

  return join(BUILD_DIR, '_brisa', `temp-${tempName}.ts`);
}

export function normalizePath(rawPathname: string, separator = sep) {
  const pathname =
    rawPathname[0] === '{' ? JSON.parse(rawPathname).client : rawPathname;

  return pathname.replaceAll(separator, '/');
}
