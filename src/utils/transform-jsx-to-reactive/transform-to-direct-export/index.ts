import { ESTree } from "meriyah";

const DIRECT_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "VariableDeclaration",
]);

/**
 * transformToDirectExport
 *
 * @description Transform no-direct default export to a direct default export
 * @example
 * Input:
 *  const MyComponent = (props) => <div>{props.foo}</div>;
 *  export default MyComponent;
 *
 * Output:
 *  export default (props) => <div>{props.foo}</div>;
 *
 * @param {ESTree.Program} ast
 * @returns {ESTree.Program}
 */
export default function transformToDirectExport(
  ast: ESTree.Program,
): ESTree.Program {
  const defaultExportIndex = ast.body.findIndex(
    (node) => node.type === "ExportDefaultDeclaration",
  );

  if (defaultExportIndex === -1) return ast;

  const defaultExportNode = ast.body[defaultExportIndex] as any;

  if (DIRECT_TYPES.has(defaultExportNode.declaration.type)) return ast;

  const astWithoutDefaultExport = {
    ...ast,
    body: ast.body.filter((node, index) => index !== defaultExportIndex),
  };

  const componentDeclarationIndex = ast.body.findIndex((node: any) => {
    const name =
      node.id?.name ??
      node.declaration?.name ??
      node?.declarations?.[0]?.id?.name;
    return (
      DIRECT_TYPES.has(node.type) && name === defaultExportNode.declaration.name
    );
  });

  if (componentDeclarationIndex === -1) return ast;

  const componentDeclaration = ast.body[componentDeclarationIndex];

  if (componentDeclaration.type === "VariableDeclaration") {
    const updatedBody = astWithoutDefaultExport.body.map((node, index) => {
      if (index === componentDeclarationIndex) {
        return {
          ...node,
          type: "ExportDefaultDeclaration",
          declaration: componentDeclaration.declarations[0].init,
        };
      }
      return node;
    });

    return { ...astWithoutDefaultExport, body: updatedBody } as ESTree.Program;
  }

  return ast;
}
