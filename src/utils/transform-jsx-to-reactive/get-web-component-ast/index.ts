import { ESTree } from "meriyah";

export default function getWebComponentAst(
  ast: ESTree.Program,
): null[] | [ESTree.FunctionDeclaration, number, number] {
  const empty = [null];
  const defaultExportIndex = ast.body.findIndex(
    (node: any) =>
      node.type === "ExportDefaultDeclaration" &&
      node.declaration.type !== "Literal" &&
      node.declaration.value !== null,
  );

  let identifierDeclarationIndex = -1;

  if (defaultExportIndex === -1) return empty;

  const defaultExport = ast.body[
    defaultExportIndex
  ] as ESTree.ExportDefaultDeclaration;

  const { type, name } = defaultExport.declaration as ESTree.Identifier;

  if (type === "Identifier") {
    const declaration = ast.body.find((node: any, index: number) => {
      const declarationName = node.declarations?.[0].id?.name ?? node?.id?.name;
      identifierDeclarationIndex = index;
      return node.type.endsWith("Declaration") && declarationName === name;
    }) as ESTree.FunctionDeclaration;

    if (!declaration) return empty;

    return [declaration, defaultExportIndex, identifierDeclarationIndex];
  }

  return [
    defaultExport.declaration as ESTree.FunctionDeclaration,
    defaultExportIndex,
    identifierDeclarationIndex,
  ];
}
