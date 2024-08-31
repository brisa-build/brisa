import { getConstants } from '@/constants';
import resolveImportSync from '@/utils/resolve-import-sync';
import type { ESTree } from 'meriyah';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
    return fileURLToPath(import.meta.resolve(path, base));
  }
}
