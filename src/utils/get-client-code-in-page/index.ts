import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { getConstants } from "@/constants";
import AST from "@/utils/ast";
import { injectUnsuspenseCode } from "@/utils/inject-unsuspense-code" with { type: "macro" };
import { injectClientContextProviderCode } from "@/utils/context-provider/inject-client" with { type: "macro" };
import transformJSXToReactive from "@/utils/transform-jsx-to-reactive";
import createContextPlugin from "@/utils/create-context/create-context-plugin";
import snakeToCamelCase from "@/utils/snake-to-camelcase";
import analyzeClientAst from "@/utils/analyze-client-ast";
import getI18nClientCode from "../get-i18n-client-code";

type TransformOptions = {
  webComponentsList: Record<string, string>;
  useContextProvider: boolean;
  useI18n: boolean;
  i18nKeys: Set<string>;
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

  let { useSuspense, useI18n, i18nKeys, useContextProvider } =
    await analyzeClientAst(ast, allWebComponents);

  // Web components inside web components
  const nestedComponents = await Promise.all(
    Object.values(pageWebComponents).map(
      async (path) =>
        await analyzeClientAst(await getAstFromPath(path), allWebComponents),
    ),
  );

  for (const item of nestedComponents) {
    useContextProvider ||= item.useContextProvider;
    useI18n ||= item.useI18n;
    useSuspense ||= item.useSuspense;
    i18nKeys = new Set([...i18nKeys, ...item.i18nKeys]);
    Object.assign(pageWebComponents, item.webComponents);
  }

  const unsuspense = useSuspense ? unsuspenseScriptCode : "";

  size += unsuspense.length;

  if (!Object.keys(pageWebComponents).length) return { code, unsuspense, size };

  const transformedCode = await transformToWebComponents({
    webComponentsList: pageWebComponents,
    useContextProvider,
    useI18n,
    i18nKeys,
  });

  if (!transformedCode) return null;

  code += transformedCode?.code;
  size += transformedCode?.size ?? 0;

  return { code, unsuspense, size };
}

async function transformToWebComponents({
  webComponentsList,
  useContextProvider,
  useI18n,
  i18nKeys,
}: TransformOptions) {
  const { SRC_DIR, BUILD_DIR, CONFIG, LOG_PREFIX, IS_PRODUCTION } =
    getConstants();

  const internalDir = join(BUILD_DIR, "_brisa");
  const webEntrypoint = join(internalDir, `temp-${crypto.randomUUID()}.ts`);

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

  code += `${imports}\n`;

  // It is important that this comes before the customElements
  // definition, otherwise the web components will not have
  // access to i18n.
  //
  // Besides, it is necessary to add an import also for
  // the transalteCore.
  if (useI18n) code += getI18nClientCode(i18nKeys.size > 0);

  code +=
    numCustomElements === 1
      ? `${customElementsDefinitions};`
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
        name: "web-components-transformer",
        setup(build) {
          build.onLoad({ filter: /.*(tsx|jsx)$/ }, async ({ path, loader }) => {
            let code = await Bun.file(path).text();

            try {
              code = transformJSXToReactive(code, path);
            } catch (error) {
              console.log(LOG_PREFIX.ERROR, `Error transforming ${path}`);
              console.log(LOG_PREFIX.ERROR, (error as Error).message);
            }

            return {
              contents: code,
              loader,
            };
          });
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

  return { code: await outputs[0].text(), size: outputs[0].size };
}
