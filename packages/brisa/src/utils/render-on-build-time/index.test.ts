import { describe, it, expect } from 'bun:test';
import AST from '../ast';
import renderOnBuild from '.';
import { normalizeHTML } from '@/helpers';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');

describe('utils', () => {
  describe('renderOnBuildTime aka: renderOn="build"', () => {
    it('should transfrom the ast to apply the prerender macro', () => {
      const code = `
				import Foo from '@/foo';

				export default function App() {
					return <Foo renderOn="build" foo="bar" />;
				}
			`;
      const expectedCode = normalizeHTML(`
				import {__prerender__macro} from 'brisa/server';
				import Foo from '@/foo';

				export default function App() {
					return __prerender__macro({
						componentPath: "@/foo",
						componentModuleName: "default",
						componentProps: {foo: "bar"}
					});
				}
			`);

      const output = getOutput(code);
      expect(output).toEqual(expectedCode);
    });
  });
});

function getOutput(code: string) {
  const ast = parseCodeToAST(code);
  const p = renderOnBuild();
  const newAst = JSON.parse(
    JSON.stringify(ast, p.step1_modifyJSXToPrerenderComponents),
  );

  p.step2_addPrerenderImport(newAst);

  return normalizeHTML(generateCodeFromAST(newAst));
}
