import { rm, writeFile } from 'node:fs/promises';
import { join, sep } from 'node:path';

import { getConstants } from '@/constants';
import AST from '@/utils/ast';
import {
  injectRPCCode,
  injectRPCCodeForStaticApp,
  injectRPCLazyCode,
} from '@/utils/rpc' with { type: 'macro' };
import { injectUnsuspenseCode } from '@/utils/inject-unsuspense-code' with {
  type: 'macro',
};
import { injectClientContextProviderCode } from '@/utils/context-provider/inject-client' with {
  type: 'macro',
};
import { injectBrisaDialogErrorCode } from '@/utils/brisa-error-dialog/inject-code' with {
  type: 'macro',
};
import clientBuildPlugin from '@/utils/client-build-plugin';
import createContextPlugin from '@/utils/create-context/create-context-plugin';
import snakeToCamelCase from '@/utils/snake-to-camelcase';
import analyzeServerAst from '@/utils/analyze-server-ast';
import { logBuildError } from '@/utils/log/log-build';
import { shouldTransferTranslatedPagePaths } from '@/utils/transfer-translated-page-paths';
import getDefinedEnvVar from '../get-defined-env-var';

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

const ASTUtil = AST('tsx');
const unsuspenseScriptCode = injectUnsuspenseCode() as unknown as string;
const RPCLazyCode = injectRPCLazyCode() as unknown as string;

function getRPCCode() {
  const { IS_PRODUCTION, IS_STATIC_EXPORT } = getConstants();
  return (IS_STATIC_EXPORT && IS_PRODUCTION
    ? injectRPCCodeForStaticApp()
    : injectRPCCode()) as unknown as string;
}

async function getAstFromPath(path: string) {
  return ASTUtil.parseCodeToAST(
    path[0] === '{' ? '' : await Bun.file(path).text(),
  );
}

export default async function getClientCodeInPage({
  pagePath,
  allWebComponents = {},
  pageWebComponents = {},
  integrationsPath,
  layoutHasContextProvider,
}: ClientCodeInPageProps) {
  let size = 0;
  let code = '';

  const ast = await getAstFromPath(pagePath);

  let { useSuspense, useContextProvider, useActions, useHyperlink } =
    analyzeServerAst(ast, allWebComponents, layoutHasContextProvider);

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

  if (!Object.keys(pageWebComponents).length) {
    return {
      code,
      unsuspense,
      rpc,
      useContextProvider,
      lazyRPC,
      size,
      useI18n: false,
      i18nKeys: new Set<string>(),
    };
  }

  const transformedCode = await transformToWebComponents({
    webComponentsList: pageWebComponents,
    useContextProvider,
    integrationsPath,
    pagePath,
  });

  if (!transformedCode) return null;

  code += transformedCode?.code;
  size += transformedCode?.size ?? 0;

  return {
    code,
    unsuspense,
    rpc,
    useContextProvider,
    lazyRPC,
    size,
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
  const {
    SRC_DIR,
    BUILD_DIR,
    CONFIG,
    I18N_CONFIG,
    LOG_PREFIX,
    IS_DEVELOPMENT,
    IS_PRODUCTION,
    VERSION_HASH,
  } = getConstants();

  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);
  const internalDir = join(BUILD_DIR, '_brisa');
  const webEntrypoint = join(internalDir, `temp-${VERSION_HASH}.ts`);
  let useI18n = false;
  let i18nKeys = new Set<string>();
  const webComponentsPath = Object.values(webComponentsList);
  let useWebContextPlugins = false;
  const entries = Object.entries(webComponentsList);

  // Note: JS imports in Windows have / instead of \, so we need to replace it
  let imports = entries
    .map(([name, path]) =>
      path[0] === '{'
        ? `import "${normalizePath(path)}";`
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
    const brisaDialogErrorCode =
      injectBrisaDialogErrorCode() as unknown as string;
    code += brisaDialogErrorCode;
  }

  code += `${imports}\n`;

  // Inject web context plugins to window to be used inside web components
  if (useWebContextPlugins) {
    code += 'window._P=webContextPlugins;\n';
  }

  code += `${defineElement}\n${customElementsDefinitions};`;

  await writeFile(webEntrypoint, code);

  const envVar = getDefinedEnvVar();

  const { success, logs, outputs } = await Bun.build({
    entrypoints: [webEntrypoint],
    root: SRC_DIR,
    // TODO: format: "iife" when Bun support it
    // https://bun.sh/docs/bundler#format
    target: 'browser',
    minify: IS_PRODUCTION,
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
      { dev: !IS_PRODUCTION, isServer: false, entrypoint: pagePath },
    ),
  });

  await rm(webEntrypoint);

  if (!success) {
    logBuildError('Failed to compile web components', logs);
    return null;
  }

  return {
    code: '(() => {' + (await outputs[0].text()) + '})();',
    size: outputs[0].size,
    useI18n,
    i18nKeys,
  };
}

export function normalizePath(rawPathname: string, separator = sep) {
  const pathname =
    rawPathname[0] === '{' ? JSON.parse(rawPathname).client : rawPathname;

  return pathname.replaceAll(separator, '/');
}
