import { normalizeQuotes } from '@/helpers';
import AST from '@/utils/ast';
import { describe, it, expect } from 'bun:test';
import wrapDefaultExportWithSSRWebComponent from '.';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');

describe('utils/server-component-plugin/wrap-default-export-with-ssr-web-component', () => {
  it('should wrap the default export with SSR web component', () => {
    const ast = parseCodeToAST(`
				export default function WebComponent() {
					return 'hello';
				}
			`);

    wrapDefaultExportWithSSRWebComponent(ast, 'web-component');

    expect(normalizeQuotes(generateCodeFromAST(ast))).toBe(
      normalizeQuotes(`
			function WebComponent() {
				return 'hello';
			}

			export default function (props) {
				return jsxDEV(_Brisa_SSRWebComponent, {
						Component: WebComponent,
						selector: "web-component",
						...props
				});
			}
			`),
    );
  });

  it('should work with export default with an identifier', () => {
    const ast = parseCodeToAST(`
			export default WebComponent;
		`);

    wrapDefaultExportWithSSRWebComponent(ast, 'web-component');

    expect(normalizeQuotes(generateCodeFromAST(ast))).toBe(
      normalizeQuotes(`
			export default function (props) {
				return jsxDEV(_Brisa_SSRWebComponent, {
						Component: WebComponent,
						selector: "web-component",
						...props
				});
			}
			`),
    );
  });

  it('should work with export default of an arrow function', () => {
    const ast = parseCodeToAST(`
			export default () => 'hello';
		`);

    wrapDefaultExportWithSSRWebComponent(ast, 'web-component');

    expect(normalizeQuotes(generateCodeFromAST(ast))).toBe(
      normalizeQuotes(`
			export default function (props) {
				return jsxDEV(_Brisa_SSRWebComponent, {
						Component: () => 'hello',
						selector: "web-component",
						...props
				});
			}
			`),
    );
  });
});
