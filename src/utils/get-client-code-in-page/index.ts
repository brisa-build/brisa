import { injectUnsuspenseCode } from "../../core/inject-unsuspense-code" assert { type: "macro" };
import AST from "../ast";
import transformToWebComponent from "../transform-to-web-component";

const ASTUtil = AST("js");
const unsuspenseScriptCode = await injectUnsuspenseCode();

export default async function getClientCodeInPage(
  pagepath: string,
  allWebComponents: Record<string, string> = {},
) {
  const file = Bun.file(pagepath);
  const ast = ASTUtil.parseCodeToAST(await file.text());
  const webComponents = new Map<string, string>();
  let useSuspense = false;
  let size = 0;
  let code = "";

  JSON.stringify(ast, (key, value) => {
    const webComponentName = value?.arguments?.[0]?.value ?? "";
    const webComponent = allWebComponents[webComponentName];
    const isWebComponent =
      webComponent &&
      value?.type === "CallExpression" &&
      value?.callee?.type === "Identifier" &&
      value?.arguments?.[0]?.type === "Literal";

    if (isWebComponent) {
      webComponents.set(webComponentName, webComponent);
    }

    useSuspense ||=
      value?.type === "ExpressionStatement" &&
      value?.expression?.operator === "=" &&
      value?.expression?.left?.property?.name === "suspense";

    return value;
  });

  if (useSuspense) {
    code += unsuspenseScriptCode;
    size += unsuspenseScriptCode.length;
  }

  for (const [name, path] of webComponents) {
    const transformedCode = await transformToWebComponent(name, path);

    if (!transformedCode) return null;

    code += transformedCode?.code;
    size += transformedCode?.size ?? 0;
  }

  return { code, size };
}
