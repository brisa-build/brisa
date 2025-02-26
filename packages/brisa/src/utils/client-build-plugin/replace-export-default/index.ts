import type { ESTree } from 'meriyah';

export default function replaceExportDefault(
  ast: ESTree.Program,
  name: string,
) {
  return {
    ...ast,
    body: ast.body.map((node) => {
      if (node.type === 'ExportDefaultDeclaration') {
        return {
          type: 'VariableDeclaration',
          kind: 'const',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {
                type: 'Identifier',
                name,
              },
              init: node.declaration,
            },
          ],
        };
      }
      return node;
    }),
  } as ESTree.Program;
}
