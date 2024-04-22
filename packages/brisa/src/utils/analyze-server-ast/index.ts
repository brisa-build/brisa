import type { ESTree } from "meriyah";

export default function analyzeServerAst(
  ast: ESTree.Program,
  allWebComponents: Record<string, string>,
  layoutHasContextProvider?: boolean,
) {
  const webComponents: Record<string, string> = {};
  let useHyperlink = false;
  let useSuspense = false;
  let useActions = false;
  let useContextProvider = layoutHasContextProvider ?? false;

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

    const isHyperlink =
      value?.arguments?.[0]?.type === "Literal" &&
      value?.arguments?.[0]?.value === "a" &&
      value?.arguments?.[1]?.properties;

    if (isHyperlink) {
      let detected = false;

      for (let prop of value.arguments[1].properties) {
        // avoid target="_blank"
        if (prop.key.name === "target" && prop.value.value === "_blank") {
          detected = false;
          break;
        }

        // Detect hyperlink with relative path
        if (prop.key.name === "href" && !URL.canParse(prop.value.value)) {
          detected = true;
        }
      }

      useHyperlink ||= detected;
    }

    // Detect actions
    useActions ||= value === "data-action";

    // Detect suspense
    useSuspense ||=
      value?.type === "ExpressionStatement" &&
      value?.expression?.operator === "=" &&
      value?.expression?.left?.property?.name === "suspense";

    return value;
  });

  return {
    webComponents,
    useSuspense,
    useContextProvider,
    useActions,
    useHyperlink,
  };
}
