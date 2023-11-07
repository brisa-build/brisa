/**
 * TODO:
 *
 * When Bun will support AST utils, then:
 *
 * - Replace this file to Bun code and remove this file
 * - Remove astring and meriyah dependencies
 */
import { generate } from "astring";
import { parseScript, ESTree } from "meriyah";
import { JavaScriptLoader } from "bun";

export default function AST(loader: JavaScriptLoader = "tsx") {
  const transpiler = new Bun.Transpiler({ loader });

  return {
    parseCodeToAST(code: string): ESTree.Program {
      return parseScript(transpiler.transformSync(code), {
        jsx: true,
        module: true,
      });
    },
    generateCodeFromAST(ast: ESTree.Program) {
      return generate(ast, { indent: "  " });
    },
  };
}
