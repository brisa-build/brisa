import { ESTree } from "meriyah";

export default function getWebComponentAst(
  ast: ESTree.Program
): (ESTree.FunctionDeclaration | null | number)[] {
  const empty = [null];
  const defaultExportIndex = ast.body.findIndex(
    (node) => node.type === "ExportDefaultDeclaration"
  );

  if (defaultExportIndex === -1) return empty;

  const defaultExport = ast.body[
    defaultExportIndex
  ] as ESTree.ExportDefaultDeclaration;

  const { type, name } = defaultExport.declaration as ESTree.Identifier;

  if (type === "Identifier") {
    const declaration = ast.body.find((node: any) => {
      const declarationName = node.declarations?.[0].id?.name ?? node?.id?.name;
      return node.type.endsWith("Declaration") && declarationName === name;
    }) as ESTree.FunctionDeclaration;

    if (!declaration) return empty;

    return [declaration, defaultExportIndex];
  }

  return [
    defaultExport.declaration as ESTree.FunctionDeclaration,
    defaultExportIndex,
  ];
}
