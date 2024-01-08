import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import getConstants from "@/constants";
import AST from "@/utils/ast";
import { injectUnsuspenseCode } from "@/utils/inject-unsuspense-code" with { type: "macro" };
import { injectClientContextProviderCode } from "@/utils/context-provider/inject-client" with { type: "macro" };
import transformJSXToReactive from "@/utils/transform-jsx-to-reactive";
import createContextPlugin from "@/utils/create-context/create-context-plugin";
import snakeToCamelCase from "@/utils/snake-to-camelcase";

const ASTUtil = AST("tsx");
const unsuspenseScriptCode = await injectUnsuspenseCode();
const ENV_VAR_PREFIX = "BRISA_PUBLIC_";

export default async function getClientCodeInPage(
  pagepath: string,
  allWebComponents: Record<string, string> = {},
  pageWebComponents: Record<string, string> = {},
) {
  let size = 0;
  let code = "";

  let { useSuspense, useContextProvider } = await analyzeClientPath(
    pagepath,
    allWebComponents,
  );

  // Web components inside web components
  const nestedComponents = await Promise.all(
    Object.values(pageWebComponents).map((path) =>
      analyzeClientPath(path, allWebComponents),
    ),
  );

  for (const item of nestedComponents) {
    useContextProvider ||= item.useContextProvider;
    Object.assign(pageWebComponents, item.webComponents);
  }

  if (useSuspense) {
    code += unsuspenseScriptCode;
    size += unsuspenseScriptCode.length;
  }

  if (!Object.keys(pageWebComponents).length) return { code, size };

  const transformedCode = await transformToWebComponents(
    pageWebComponents,
    useContextProvider,
  );

  if (!transformedCode) return null;

  code += transformedCode?.code;
  size += transformedCode?.size ?? 0;

  return { code, size };
}

async function transformToWebComponents(
  webComponentsList: Record<string, string>,
  useContextProvider: boolean,
) {
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

  code +=
    numCustomElements === 1
      ? `${imports}\n${customElementsDefinitions}`
      : `${imports}\n${defineElement}\n${customElementsDefinitions}`;

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

async function analyzeClientPath(
  path: string,
  allWebComponents: Record<string, string>,
) {
  const pageFile = Bun.file(path);
  const ast = ASTUtil.parseCodeToAST(await pageFile.text());
  const webComponents: Record<string, string> = {};
  let useSuspense = false;
  let useContextProvider = false;

  JSON.stringify(ast, (key, value) => {
    const webComponentSelector = value?.arguments?.[0]?.value ?? "";
    const webComponentPath = allWebComponents[webComponentSelector];
    const isCustomElement =
      value?.type === "CallExpression" &&
      value?.callee?.type === "Identifier" &&
      value?.arguments?.[0]?.type === "Literal";

    const isWebComponent = webComponentPath && isCustomElement;

    if (isCustomElement && webComponentSelector === "context-provider") {
      const serverOnlyProps = value?.arguments?.[1]?.properties?.find?.(
        (e: any) => e?.key?.name === "serverOnly",
      );

      useContextProvider ||= serverOnlyProps?.value?.value !== true;
    }

    if (isWebComponent) {
      webComponents[webComponentSelector] = webComponentPath;
    }

    useSuspense ||=
      value?.type === "ExpressionStatement" &&
      value?.expression?.operator === "=" &&
      value?.expression?.left?.property?.name === "suspense";

    return value;
  });

  return { webComponents, useSuspense, useContextProvider };
}
