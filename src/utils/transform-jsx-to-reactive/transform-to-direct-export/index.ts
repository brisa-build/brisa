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

  // Add "export default null" if there is no default export
  if (defaultExportIndex === -1) {
    return {
      ...ast,
      body: [
        ...ast.body,
        {
          type: "ExportDefaultDeclaration",
          declaration: { type: "Literal", value: null },
        },
      ],
    };
  }

  const defaultExportNode = ast.body[defaultExportIndex] as any;

  if (DIRECT_TYPES.has(defaultExportNode.declaration.type)) return ast;

  const astWithoutDefaultExport = {
    ...ast,
    body: ast.body.filter((node, index) => index !== defaultExportIndex),
  };

  let componentDeclarationIndex = ast.body.findIndex((node: any) => {
    return (
      DIRECT_TYPES.has(node.type) &&
      getName(node) === defaultExportNode.declaration.name
    );
  });

  if (componentDeclarationIndex === -1) return ast;

  let componentDeclaration = ast.body[componentDeclarationIndex] as any;

  // Manage: let Component; Component = () => <div>foo</div>; export default Component;
  if ((componentDeclaration as any)?.declarations?.[0]?.init === null) {
    for (let i = ast.body.length - 1; i > componentDeclarationIndex; i--) {
      const node = ast.body[i];

      if (
        node.type === "ExpressionStatement" &&
        node.expression.type === "AssignmentExpression" &&
        node.expression.left.type === "Identifier" &&
        node.expression.left.name === getName(componentDeclaration)
      ) {
        componentDeclaration = {
          ...componentDeclaration,
          declarations: [
            {
              ...componentDeclaration.declarations[0],
              init: node.expression.right,
            },
          ],
        };
        astWithoutDefaultExport.body.splice(i, 1);
        break;
      }
    }
  }

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

function getName(node: any) {
  return (
    node?.id?.name ??
    node?.declaration?.name ??
    node?.declarations?.[0]?.id?.name
  );
}
