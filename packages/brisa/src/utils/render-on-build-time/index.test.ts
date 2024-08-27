import { describe, it, expect } from 'bun:test';
import AST from '../ast';
import prerenderMacro from '.';
import { normalizeHTML } from '@/helpers';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');

describe('utils', () => {
  describe('renderOnBuildTime aka: renderOn="build"', () => {
    it('should transfrom the ast to apply the prerender macro', () => {
      const ast = parseCodeToAST(`
				import Foo from '@/foo';

				export default function App() {
					return <Foo renderOn="build" foo="bar" />;
				}
			`);
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

      const output = normalizeHTML(generateCodeFromAST(prerenderMacro(ast)));
      expect(output).toEqual(expectedCode);
    });
  });
});
