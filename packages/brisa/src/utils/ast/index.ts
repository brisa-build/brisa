/**
 * TODO:
 *
 * When Bun will support AST utils, then:
 *
 * - Replace this file to Bun code and remove this file
 * - Remove astring and meriyah dependencies
 */
import { generate } from 'astring';
import type { JavaScriptLoader } from 'bun';
import { type ESTree, parseScript } from 'meriyah';

export default function AST(loader: JavaScriptLoader = 'tsx') {
  const transpiler = typeof Bun !== 'undefined' ? new Bun.Transpiler({ loader }) : { transformSync: (code: string) => code };

  return {
    parseCodeToAST(code: string): ESTree.Program {
      return parseScript(transpiler.transformSync(code), {
        jsx: true,
        module: true,
        next: true,
      });
    },
    generateCodeFromAST(ast: ESTree.Program) {
      return generate(ast, { indent: '  ' });
    },
  };
}
