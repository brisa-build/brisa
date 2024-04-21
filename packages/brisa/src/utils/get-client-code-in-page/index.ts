import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { getConstants } from "@/constants";
import AST from "@/utils/ast";
import {
  injectRPCCode,
  injectRPCLazyCode,
} from "@/utils/rpc" with { type: "macro" };
import { injectUnsuspenseCode } from "@/utils/inject-unsuspense-code" with { type: "macro" };
import { injectClientContextProviderCode } from "@/utils/context-provider/inject-client" with { type: "macro" };
import clientBuildPlugin from "@/utils/client-build-plugin";
import createContextPlugin from "@/utils/create-context/create-context-plugin";
import snakeToCamelCase from "@/utils/snake-to-camelcase";
import analyzeServerAst from "@/utils/analyze-server-ast";

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

const ASTUtil = AST("tsx");
const unsuspenseScriptCode = await injectUnsuspenseCode();
const rpcCode = await injectRPCCode();
const RPCLazyCode = await injectRPCLazyCode();
const ENV_VAR_PREFIX = "BRISA_PUBLIC_";

async function getAstFromPath(path: string) {
  return ASTUtil.parseCodeToAST(await Bun.file(path).text());
}

export default async function getClientCodeInPage({
  pagePath,
  allWebComponents = {},
  pageWebComponents = {},
  integrationsPath,
  layoutHasContextProvider,
}: ClientCodeInPageProps) {
  let size = 0;
  let code = "";

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

  const unsuspense = useSuspense ? unsuspenseScriptCode : "";
  const rpc = useActions || useHyperlink ? rpcCode : "";
  const lazyRPC = useActions || useHyperlink ? RPCLazyCode : "";

  size += unsuspense.length;
  size += rpc.length;

  if (!Object.keys(pageWebComponents).length)
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

async function transformToWebComponents({
  webComponentsList,
  useContextProvider,
  integrationsPath,
  pagePath,
}: TransformOptions) {
  const {
    SRC_DIR,
    BUILD_DIR,
    CONFIG,
    LOG_PREFIX,
    IS_PRODUCTION,
    VERSION_HASH,
  } = getConstants();

  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);
  const internalDir = join(BUILD_DIR, "_brisa");
  const webEntrypoint = join(internalDir, `temp-${VERSION_HASH}.ts`);
  let useI18n = false;
  let i18nKeys = new Set<string>();
  const webComponentsPath = Object.values(webComponentsList);
  let useWebContextPlugins = false;
  let imports = Object.entries(webComponentsList)
    .map((e) => `import ${snakeToCamelCase(e[0])} from "${e[1]}";`)
    .join("\n");

  // Add web context plugins import only if there is a web context plugin
  if (integrationsPath) {
    const module = await import(integrationsPath);
    if (module.webContextPlugins?.length > 0) {
      useWebContextPlugins = true;
      imports += `import {webContextPlugins} from "${integrationsPath}";`;
    }
  }

  const defineElement =
    "const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);";

  const customElementKeys = Object.keys(webComponentsList);

  if (useContextProvider) {
    customElementKeys.unshift("context-provider");
  }

  const numCustomElements = customElementKeys.length;
  const customElementsDefinitions = customElementKeys
    .map((k) => `defineElement("${k}", ${snakeToCamelCase(k)});`,
    )
    .join("\n");

  let code = "";

  if (useContextProvider) {
    const contextProviderCode = await injectClientContextProviderCode();
    code += contextProviderCode;
  }

  code += `${imports}\n`;

  // Inject web context plugins to window to be used inside web components
  if (useWebContextPlugins) {
    code += "window._P=webContextPlugins;\n";
  }

  code +=
    numCustomElements === 1
      ? customElementsDefinitions
      : `${defineElement}\n${customElementsDefinitions};`;

  await writeFile(webEntrypoint, code);

  const envVar: Record<string, string> = {};

  for (const envKey in Bun.env) {
    if (envKey.startsWith(ENV_VAR_PREFIX)) {
      envVar[`process.env.${envKey}`] = Bun.env[envKey] ?? "";
    }
  }

  const { success, logs, outputs } = await Bun.build({
    entrypoints: [webEntrypoint],
    root: SRC_DIR,
    // TODO: format: "iife" when Bun support it
    // https://bun.sh/docs/bundler#format
    target: "browser",
    minify: IS_PRODUCTION,
    define: {
      __DEV__: (!IS_PRODUCTION).toString(),
      __WEB_CONTEXT_PLUGINS__: useWebContextPlugins.toString(),
      __BASE_PATH__: JSON.stringify(CONFIG.basePath),
      ...envVar,
    },
    plugins: extendPlugins(
      [
        {
          name: "client-build-plugin",
          setup(build) {
            build.onLoad(
              {
                filter: new RegExp(
                  `(.*/src/web-components/(?!_integrations).*\\.(tsx|jsx|js|ts)|${webComponentsPath.join(
                    "|",
                  )})$`,
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
    logs.forEach((log) => console.error(log));
    return null;
  }

  return {
    code: await outputs[0].text(),
    size: outputs[0].size,
    useI18n,
    i18nKeys,
  };
}
