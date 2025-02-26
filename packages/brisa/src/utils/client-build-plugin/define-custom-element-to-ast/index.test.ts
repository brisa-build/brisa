import { normalizeHTML } from '@/helpers';
import AST from '@/utils/ast';
import { describe, it, expect } from 'bun:test';
import defineCustomElementToAST from '.';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');

describe('utils/client-build-plugin/define-custom-element-to-ast', () => {
  it('should define the custom element and remove the export default', () => {
    const ast = parseCodeToAST(`
      import {Component} from 'brisa';
      export default brisaElement(Component)
    `);

    defineCustomElementToAST(ast, {
      selector: 'my-component',
      content: {
        type: 'Identifier',
        name: 'MyComponent',
      },
    });

    expect(normalizeHTML(generateCodeFromAST(ast))).toBe(
      normalizeHTML(`
				import {Component} from 'brisa';

				if (!customElements.get('my-component')) {
						customElements.define('my-component', MyComponent);
				}`),
    );
  });

  it('should define the custom element and remove the export default with a complex content', () => {
    const ast = parseCodeToAST(`
			import {Component} from 'brisa';
			export default brisaElement(Component)
		`);

    defineCustomElementToAST(ast, {
      selector: 'my-component',
      content: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'brisaElement',
        },
        arguments: [
          {
            type: 'Identifier',
            name: 'MyComponent',
          },
        ],
      },
    });

    expect(normalizeHTML(generateCodeFromAST(ast))).toBe(
      normalizeHTML(`
				import {Component} from 'brisa';

				if (!customElements.get('my-component')) {
						customElements.define('my-component', brisaElement(MyComponent));
				}`),
    );
  });

  it('should work with export default in the middle of the file', () => {
    const ast = parseCodeToAST(`
			import {Component} from 'brisa';
			const a = 1;
			export default brisaElement(Component)
			console.log('Hello');
		`);

    defineCustomElementToAST(ast, {
      selector: 'my-component',
      content: {
        type: 'Identifier',
        name: 'MyComponent',
      },
    });

    expect(normalizeHTML(generateCodeFromAST(ast))).toBe(
      normalizeHTML(`
				import {Component} from 'brisa';
				const a = 1;
				console.log('Hello');
				if (!customElements.get('my-component')) {
						customElements.define('my-component', MyComponent);
				}`),
    );
  });
});
