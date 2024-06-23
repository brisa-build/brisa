import type { BunPlugin } from "bun";
import { logError } from "@/utils/log/log-build";
import AST from "@/utils/ast";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

globalThis.BrisaRegistry =
  globalThis.BrisaRegistry || new Map<string, number>();

/**
 * This Bun build plugin is responsible for generating the isomorphic context ID.
 *
 * The context ID is a unique identifier that is used to identify the context, and
 * it is important that it is the same on the server and on the client to avoid
 * hydration errors and facilitate the comunication between the two.
 */
export default function createContextPlugin() {
  return {
    name: "context-plugin",
    setup(build) {
      build.onLoad(
        { filter: new RegExp(".*/src/.*\\.(tsx|jsx|js|ts|mdx)") },
        async ({ path, loader }) => {
          let code = await Bun.file(path).text();

          try {
            code = generateContextID(code, path);
          } catch (error) {
            logError({
              messages: [
                `It was not possible to generate a contextID in ${path}`,
                (error as Error).message,
              ],
            });
          }

          return {
            contents: code,
            loader,
          };
        },
      );
    },
  } satisfies BunPlugin;
}

export function generateContextID(code: string, path: string) {
  if (!code.includes("createContext") || !code.includes("brisa")) return code;

  const ast = parseCodeToAST(code);
  const pageId = globalThis.BrisaRegistry.has(path)
    ? globalThis.BrisaRegistry.get(path)
    : globalThis.BrisaRegistry.set(path, globalThis.BrisaRegistry.size).get(
        path,
      );

  let identifier: string | undefined;
  let count = 0;

  function traverseAToB(key: string, value: any) {
    if (identifier) return value;

    // ESM
    if (
      value?.type === "ImportDeclaration" &&
      value?.source?.value === "brisa"
    ) {
      for (const specifier of value?.specifiers ?? []) {
        if (specifier?.imported?.name === "createContext") {
          identifier = specifier?.local?.name;
          return value;
        }
      }
    }

    // CJS
    else if (
      value?.type === "VariableDeclarator" &&
      value?.init?.callee?.name === "require"
    ) {
      if (value?.id?.type === "ObjectPattern") {
        for (const property of value?.id?.properties ?? []) {
          if (property?.key?.name === "createContext") {
            identifier = property?.value?.name;
            return value;
          }
        }
      }
    }

    return value;
  }

  function traverseBToA(key: string, value: any) {
    if (
      value?.type === "CallExpression" &&
      value?.callee?.name === identifier &&
      value.arguments?.length < 2
    ) {
      const contextID = { type: "Literal", value: `${pageId}:${count++}` };
      const undefinedDefaultValue = { type: "Identifier", name: "undefined" };
      value.arguments =
        value.arguments.length === 0
          ? [undefinedDefaultValue, contextID]
          : [value.arguments[0], contextID];
    }
    return value;
  }

  const newAst = JSON.parse(JSON.stringify(ast, traverseAToB), traverseBToA);

  return generateCodeFromAST(newAst);
}
