import resolveImportSync from '@/utils/resolve-import-sync';
import type { ESTree } from 'meriyah';
import { fileURLToPath } from 'node:url';

const SPECIFIERS = new Set(['ImportDefaultSpecifier', 'ImportSpecifier']);
const AVOIDED_DEPENDENCIES = new Set(['brisa', 'brisa/server', 'brisa/client']);

export default function getDependenciesList(
  ast: ESTree.Program,
  path: string,
  initialValue?: Set<string>,
) {
  const dependenciesMap = new Set<string>(initialValue);

  for (const importAst of ast.body) {
    if (importAst.type !== 'ImportDeclaration') continue;

    const dependencyPath = resolve(importAst.source.value as string, path);

    if (!dependencyPath) continue;

    for (const specifier of importAst.specifiers) {
      if (!SPECIFIERS.has(specifier.type)) break;
      dependenciesMap.add(dependencyPath);
    }
  }

  return dependenciesMap;
}

function resolve(path: string, base: string) {
  if (AVOIDED_DEPENDENCIES.has(path)) return;
  try {
    return resolveImportSync(path, base);
  } catch {
    // It is not exactly the same, it is only the same if it has
    // the format, otherwise it does not put the format, but
    // import.meta.resolveSync does. The import.meta.resolveSync
    // throws an exception if the file does not exist, but
    // import.meta.resolve does not check if it exists and resolves
    // the absolute path without resolving the format (.js|.ts|.tsx...)
    return fileURLToPath(import.meta.resolve(path, base));
  }
}
