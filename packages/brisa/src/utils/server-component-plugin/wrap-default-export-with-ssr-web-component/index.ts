import { getConstants } from '@/constants';
import type { ESTree } from 'meriyah';

const DECLARATION_TYPES_TO_REMOVE = new Set([
  'Identifier',
  'ArrowFunctionExpression',
]);

export default function wrapDefaultExportWithSSRWebComponent(
  ast: ESTree.Program,
  selector: string,
) {
  const { IS_PRODUCTION } = getConstants();
  const exportDefaultIndex = ast.body.findIndex(
    (node) => node.type === 'ExportDefaultDeclaration',
  );

  if (exportDefaultIndex === -1) return ast;

  const exportDefaultNode = ast.body[
    exportDefaultIndex
  ] as ESTree.ExportDefaultDeclaration;
  const exportDefaultDeclaration = exportDefaultNode.declaration as any;

  const brisaSSRWebComponent: ESTree.ExportDefaultDeclaration = {
    type: 'ExportDefaultDeclaration',
    declaration: {
      type: 'FunctionDeclaration',
      id: null,
      params: [{ type: 'Identifier', name: 'props' }],
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ReturnStatement',
            argument: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: IS_PRODUCTION ? 'jsx' : 'jsxDEV',
              },
              arguments: [
                {
                  type: 'Identifier',
                  name: '_Brisa_SSRWebComponent',
                },
                {
                  type: 'ObjectExpression',
                  properties: [
                    {
                      type: 'Property',
                      key: { type: 'Literal', value: 'ssr-Component' },
                      value:
                        exportDefaultDeclaration.id ?? exportDefaultDeclaration,
                      kind: 'init',
                      computed: false,
                      method: false,
                      shorthand: false,
                    },
                    {
                      type: 'Property',
                      key: { type: 'Literal', value: 'ssr-selector' },
                      value: { type: 'Literal', value: selector },
                      kind: 'init',
                      computed: false,
                      method: false,
                      shorthand: false,
                    },
                    {
                      type: 'SpreadElement',
                      argument: { type: 'Identifier', name: 'props' },
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      generator: false,
      async: false,
    },
  };

  if (DECLARATION_TYPES_TO_REMOVE.has(exportDefaultDeclaration.type)) {
    ast.body.splice(exportDefaultIndex, 1);
  } else {
    ast.body[exportDefaultIndex] = exportDefaultDeclaration as any;
  }

  ast.body.push(brisaSSRWebComponent);

  return ast;
}
