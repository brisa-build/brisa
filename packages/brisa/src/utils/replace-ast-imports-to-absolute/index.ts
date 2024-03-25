import type { ESTree } from "meriyah";
import { logError } from "../log/log-build";

/**
 * It is necessary when we create entrypoints on the fly during compilation,
 * for example for server actions, in this case files are created based on
 * others inside the build/actions folder and then compiled in another process.
 */
export default function replaceAstImportsToAbsolute(
  ast: ESTree.Program,
  path: string,
) {
  function replacer(key: string, value: any) {
    try {
      // "import something from '../some/path'" => "import something from '/absolute/some/path'"
      if (value?.type === "ImportDeclaration") {
        value.source.value = import.meta.resolveSync(value.source.value, path);
      }

      // "require('../some/path')" => "require('/absolute/some/path')"
      if (
        value?.callee?.name === "require" &&
        value?.arguments?.[0]?.type === "Literal"
      ) {
        value.arguments = [
          {
            type: "Literal",
            value: import.meta.resolveSync(value.arguments[0].value, path),
          },
        ];
      }

      // "import('../some/path')" => "import('/absolute/some/path')"
      if (
        value?.type === "ImportExpression" &&
        value?.source?.type === "Literal"
      ) {
        value.source.value = import.meta.resolveSync(value.source.value, path);
      }
    } catch (error) {
      logError(["Error resolving import path:", (error as Error).message]);
    }

    return value;
  }

  return JSON.parse(JSON.stringify(ast, replacer));
}
