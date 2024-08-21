import type { ESTree } from 'meriyah';

type DefineCustomElementOptions = {
  selector: string;
  content: any;
};

/**
 * Define the custom element **mutating** the AST and removing the export default
 *
 * @example
 *
 * // Before
 * export default brisaElement(Component)
 *
 * // After
 *
 * if (!customElements.get(name)) {
 *  customElements.define('my-component', brisaElement(MyComponent))
 * }
 *
 * @param {ESTree.Program} ast - The AST to mutate
 * @param {DefineCustomElementOptions} options - The options to define the custom element
 *
 * @returns {void}
 */
export default function defineCustomElementToAST(
  ast: ESTree.Program,
  { selector, content }: DefineCustomElementOptions,
) {
  // Define the custom element
  ast.body.push({
    type: 'IfStatement',
    test: {
      type: 'UnaryExpression',
      operator: '!',
      argument: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'Identifier',
            name: 'customElements',
          },
          computed: false,
          property: {
            type: 'Identifier',
            name: 'get',
          },
        },
        arguments: [
          {
            type: 'Literal',
            value: selector,
          },
        ],
      },
      prefix: true,
    },
    consequent: {
      type: 'BlockStatement',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              object: {
                type: 'Identifier',
                name: 'customElements',
              },
              computed: false,
              property: {
                type: 'Identifier',
                name: 'define',
              },
            },
            arguments: [
              {
                type: 'Literal',
                value: selector,
              },
              content,
            ],
          },
        },
      ],
    },
    alternate: null,
  });

  // Remove the export default
  for (let i = 0; i < ast.body.length; i++) {
    if (ast.body[i].type === 'ExportDefaultDeclaration') {
      ast.body.splice(i, 1);
      break;
    }
  }
}
