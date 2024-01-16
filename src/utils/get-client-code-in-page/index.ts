import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { getConstants } from "@/constants";
import AST from "@/utils/ast";
import { injectUnsuspenseCode } from "@/utils/inject-unsuspense-code" with { type: "macro" };
import { injectClientContextProviderCode } from "@/utils/context-provider/inject-client" with { type: "macro" };
import clientBuildPlugin from "@/utils/client-build-plugin";
import createContextPlugin from "@/utils/create-context/create-context-plugin";
import snakeToCamelCase from "@/utils/snake-to-camelcase";
import analyzeServerAst from "@/utils/analyze-server-ast";

type TransformOptions = {
  webComponentsList: Record<string, string>;
  useContextProvider: boolean;
};

const ASTUtil = AST("tsx");
const unsuspenseScriptCode = await injectUnsuspenseCode();
const ENV_VAR_PREFIX = "BRISA_PUBLIC_";

async function getAstFromPath(path: string) {
  return ASTUtil.parseCodeToAST(await Bun.file(path).text());
}

export default async function getClientCodeInPage(
  pagepath: string,
  allWebComponents: Record<string, string> = {},
  pageWebComponents: Record<string, string> = {},
) {
  let size = 0;
  let code = "";

  const ast = await getAstFromPath(pagepath);

  let { useSuspense, useContextProvider } = analyzeServerAst(
    ast,
    allWebComponents,
  );

  // Web components inside web components
  const nestedComponents = await Promise.all(
    Object.values(pageWebComponents).map(async (path) =>
      analyzeServerAst(await getAstFromPath(path), allWebComponents),
    ),
  );

  for (const item of nestedComponents) {
    useContextProvider ||= item.useContextProvider;
    useSuspense ||= item.useSuspense;
    Object.assign(pageWebComponents, item.webComponents);
  }

  const unsuspense = useSuspense ? unsuspenseScriptCode : "";

  size += unsuspense.length;

  if (!Object.keys(pageWebComponents).length)
    return {
      code,
      unsuspense,
      size,
      useI18n: false,
      i18nKeys: new Set<string>(),
    };

  const transformedCode = await transformToWebComponents({
    webComponentsList: pageWebComponents,
    useContextProvider,
  });

  if (!transformedCode) return null;

  code += transformedCode?.code;
  size += transformedCode?.size ?? 0;

  return {
    code,
    unsuspense,
    size,
    useI18n: transformedCode.useI18n,
    i18nKeys: transformedCode.i18nKeys,
  };
}

async function transformToWebComponents({
  webComponentsList,
  useContextProvider,
}: TransformOptions) {
  const { SRC_DIR, BUILD_DIR, CONFIG, LOG_PREFIX, IS_PRODUCTION } =
    getConstants();

  const internalDir = join(BUILD_DIR, "_brisa");
  const webEntrypoint = join(internalDir, `temp-${crypto.randomUUID()}.ts`);
  let useI18n = false;
  let i18nKeys = new Set<string>();

  const imports = Object.entries(webComponentsList)
    .map((e) => `import ${snakeToCamelCase(e[0])} from "${e[1]}";`)
    .join("\n");

  const defineElement =
    "const defineElement = (name, component) => name && customElements.define(name, component);";

  const customElementKeys = Object.keys(webComponentsList);

  if (useContextProvider) {
    customElementKeys.unshift("context-provider");
  }

  const numCustomElements = customElementKeys.length;
  const customElementsDefinitions = customElementKeys
    .map((k) =>
      numCustomElements === 1
        ? `if(${snakeToCamelCase(
            k,
          )}) customElements.define("${k}", ${snakeToCamelCase(k)})`
        : `defineElement("${k}", ${snakeToCamelCase(k)});`,
    )
    .join("\n");

  let code = "";

  if (useContextProvider) {
    const contextProviderCode = await injectClientContextProviderCode();
    code += contextProviderCode;
  }

  code +=
    numCustomElements === 1
      ? `${imports}\n${customElementsDefinitions};`
      : `${imports}\n${defineElement}\n${customElementsDefinitions};`;

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
    target: "browser",
    minify: IS_PRODUCTION,
    define: {
      __DEV__: (!IS_PRODUCTION).toString(),
      ...envVar,
    },
    // TODO: format: "iife" when Bun support it
    // https://bun.sh/docs/bundler#format
    plugins: [
      {
        name: "client-build-plugin",
        setup(build) {
          build.onLoad(
            { filter: /.*\/src\/web-components\/.*\.(tsx|jsx|js|ts)$/ },
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
      ...(CONFIG?.plugins ?? []),
    ],
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
