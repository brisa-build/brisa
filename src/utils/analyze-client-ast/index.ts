import type { ESTree } from "meriyah";

export default async function analyzeClientAst(
  ast: ESTree.Program,
  allWebComponents: Record<string, string>,
) {
  const webComponents: Record<string, string> = {};
  let useSuspense = false;
  let useContextProvider = false;
  let useI18n = false;

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

    useI18n ||= value?.type === "Identifier" && value?.name === "i18n";

    useSuspense ||=
      value?.type === "ExpressionStatement" &&
      value?.expression?.operator === "=" &&
      value?.expression?.left?.property?.name === "suspense";

    return value;
  });

  return { webComponents, useSuspense, useContextProvider, useI18n };
}
