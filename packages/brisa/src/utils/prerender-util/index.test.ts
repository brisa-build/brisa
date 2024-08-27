import { describe, it, expect } from 'bun:test';
import AST from '../ast';
import getPrerenderUtil from '.';
import { normalizeHTML } from '@/helpers';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');

describe('utils', () => {
  describe('getPrerenderUtil (renderOn="build")', () => {
    it('should not transform the ast if there is no renderOn="build"', () => {
      const code = `
				import Foo from '@/foo';

				export default function App() {
					return <Foo foo="bar" />;
				}
			`;
      const expectedCode = toExpected(`
				import Foo from '@/foo';

				export default function App() {
					return jsxDEV(Foo, {foo: "bar"}, undefined, false, undefined, this);
				}
			`);

      const output = getOutput(code);
      expect(output).toEqual(expectedCode);
    });

    it('should only remove the attribute if there is renderOn="runtime"', () => {
      const code = `
				import Foo from '@/foo';

				export default function App() {
					return <Foo renderOn="runtime" foo="bar" />;
				}
			`;
      const expectedCode = toExpected(`
				import Foo from '@/foo';
				
				export default function App() {
					return jsxDEV(Foo, {foo: "bar"}, undefined, false, undefined, this);
				}`);

      const output = getOutput(code);
      expect(output).toEqual(expectedCode);
    });
    it('should transform the ast to apply the prerender macro', () => {
      const code = `
				import Foo from '@/foo';

				export default function App() {
					return <Foo renderOn="build" foo="bar" />;
				}
			`;
      const expectedCode = normalizeHTML(`
				import {__prerender__macro} from 'brisa/server' with { type: "macro" };
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

    it('should transform inside a fragment', () => {
      const code = `
				import Foo from '@/foo';

				export default function App() {
					return (
						<>
							<Foo renderOn="build" foo="bar" />
						</>
					);
				}
			`;
      const expectedCode = toExpected(`
				import {__prerender__macro} from 'brisa/server' with { type: "macro" };
				import Foo from '@/foo';

				export default function App() {
					return jsxDEV(Fragment, {children: __prerender__macro({
							componentPath: "@/foo",
							componentModuleName: "default",
							componentProps: {foo: "bar"}
						})}, undefined, false, undefined, this
					);
				}
			`);

      const output = getOutput(code);
      expect(output).toEqual(expectedCode);
    });

    it('should transform a named export component', () => {
      const code = `
			import {Foo} from '@/foo';

			export default function App() {
				return (
					<Foo renderOn="build" foo="bar" />
				);
			}
		`;
      const expectedCode = toExpected(`
			import {__prerender__macro} from 'brisa/server' with { type: "macro" };
			import {Foo} from '@/foo';

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

  it('should transform a named import with "require" component', () => {
    const code = `
			const {Foo} = require('@/foo');

			export default function App() {
				return (
					<Foo renderOn="build" foo="bar" />
				);
			}
		`;
    const expectedCode = toExpected(`
			import {__prerender__macro} from 'brisa/server' with { type: "macro" };
			const {Foo} = require('@/foo');

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

  it('should transform a default import with "require" component', () => {
    const code = `
			const Foo = require('@/foo').default;

			export default function App() {
				return (
					<div>
						<Foo renderOn="build" foo="bar" />
					</div>
				);
			}
		`;
    const expectedCode = toExpected(`
			import {__prerender__macro} from 'brisa/server' with { type: "macro" };
			const Foo = require('@/foo').default;

			export default function App() {
				return jsxDEV("div", {children: __prerender__macro({
							componentPath: "@/foo",
							componentModuleName: "default",
							componentProps: {foo: "bar"}
					})}, undefined, false, undefined, this
				);
			}
		`);

    const output = getOutput(code);
    expect(output).toEqual(expectedCode);
  });
});

function getOutput(code: string) {
  const ast = parseCodeToAST(code);
  const p = getPrerenderUtil();
  const newAst = JSON.parse(
    JSON.stringify(ast, p.step1_modifyJSXToPrerenderComponents),
  );

  p.step2_addPrerenderImport(newAst);

  return normalizeHTML(generateCodeFromAST(newAst));
}

function toExpected(code: string) {
  return normalizeHTML(code);
}
