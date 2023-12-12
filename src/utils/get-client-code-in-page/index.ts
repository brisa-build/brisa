import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import getConstants from "../../constants";
import AST from "../ast";
import { injectUnsuspenseCode } from "../inject-unsuspense-code" assert { type: "macro" };
import transformJSXToReactive from "../transform-jsx-to-reactive";

const ASTUtil = AST("tsx");
const unsuspenseScriptCode = await injectUnsuspenseCode();

export default async function getClientCodeInPage(
  pagepath: string,
  allWebComponents: Record<string, string> = {},
  pageWebComponents: Record<string, string> = {},
) {
  let size = 0;
  let code = "";

  const { useSuspense } = await analyzeClientPath(pagepath, allWebComponents);

  // Web components inside web components
  const nestedComponents = await Promise.all(
    Object.values(pageWebComponents).map((path) =>
      analyzeClientPath(path, allWebComponents),
    ),
  );

  for (const { webComponents } of nestedComponents) {
    Object.assign(pageWebComponents, webComponents);
  }

  if (useSuspense) {
    code += unsuspenseScriptCode;
    size += unsuspenseScriptCode.length;
  }

  if (!Object.keys(pageWebComponents).length) return { code, size };

  const transformedCode = await transformToWebComponents(pageWebComponents);

  if (!transformedCode) return null;

  code += transformedCode?.code;
  size += transformedCode?.size ?? 0;

  return { code, size };
}

async function transformToWebComponents(
  webComponentsList: Record<string, string>,
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

  const code =
    numCustomElements === 1
      ? `${imports}\n${customElementsDefinitions}`
      : `${imports}\n${defineElement}\n${customElementsDefinitions}`;

  await writeFile(webEntrypoint, code);

  const { success, logs, outputs } = await Bun.build({
    entrypoints: [webEntrypoint],
    root: SRC_DIR,
    target: "browser",
    minify: IS_PRODUCTION,
    define: {
      __DEV__: (!IS_PRODUCTION).toString(),
    },
    // TODO: format: "iife" when Bun support it
    // https://bun.sh/docs/bundler#format
    plugins: [
      {
        name: "web-components-transformer",
        setup(build) {
          build.onLoad(
            { filter: /.*web-components.*\.(tsx|jsx)$/ },
            async ({ path, loader }) => {
              let code = await Bun.file(path).text();

              if (!code.includes("export default")) {
                code += `\nexport default null;`;
              }

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
            },
          );
        },
      },
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

function snakeToCamelCase(str: string) {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", ""),
  );
}

async function analyzeClientPath(
  path: string,
  allWebComponents: Record<string, string>,
) {
  const pageFile = Bun.file(path);
  const ast = ASTUtil.parseCodeToAST(await pageFile.text());
  const webComponents: Record<string, string> = {};
  let useSuspense = false;

  JSON.stringify(ast, (key, value) => {
    const webComponentName = value?.arguments?.[0]?.value ?? "";
    const webComponentPath = allWebComponents[webComponentName];
    const isWebComponent =
      webComponentPath &&
      value?.type === "CallExpression" &&
      value?.callee?.type === "Identifier" &&
      value?.arguments?.[0]?.type === "Literal";

    if (isWebComponent) {
      webComponents[webComponentName] = webComponentPath;
    }

    useSuspense ||=
      value?.type === "ExpressionStatement" &&
      value?.expression?.operator === "=" &&
      value?.expression?.left?.property?.name === "suspense";

    return value;
  });

  return { webComponents, useSuspense };
}
