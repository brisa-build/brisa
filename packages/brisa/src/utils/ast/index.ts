import { generate } from 'astring';
import type { JavaScriptLoader } from 'bun';
import { type ESTree, parseScript } from 'meriyah';
import { logError } from '../log/log-build';

export default function AST(loader: JavaScriptLoader = 'tsx') {
  const isBun = typeof Bun !== 'undefined';
  const defaultTranspiler = { transformSync: (code: string) => code };

  const minifier = isBun
    ? new Bun.Transpiler({ loader, minifyWhitespace: true })
    : defaultTranspiler;

  const transpiler = isBun ? new Bun.Transpiler({ loader }) : defaultTranspiler;

  return {
    parseCodeToAST(code: string): ESTree.Program {
      try {
        return parseScript(transpiler.transformSync(code), {
          jsx: true,
          module: true,
          next: true,
        });
      } catch (e: any) {
        logError({
          messages: [`Error parsing code to AST: ${e.message}`],
          stack: e.stack,
        });
        return { type: 'Program', body: [] } as unknown as ESTree.Program;
      }
    },
    generateCodeFromAST(ast: ESTree.Program) {
      return generate(ast, { indent: '  ' });
    },
    minify(code: string) {
      return minifier.transformSync(code);
    },
  };
}
