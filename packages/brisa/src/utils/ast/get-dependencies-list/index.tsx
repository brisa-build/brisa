import type { ESTree } from "meriyah";

const SPECIFIERS = new Set(["ImportDefaultSpecifier", "ImportSpecifier"]);
const AVOIDED_DEPENDENCIES = new Set(["brisa", "brisa/server", "brisa/client"]);

export default function getDependenciesList(ast: ESTree.Program, path: string) {
  const dependenciesMap = new Set<string>();

  for (let importAst of ast.body) {
    if (importAst.type !== "ImportDeclaration") continue;

    const dependencyPath = resolve(importAst.source.value as string, path);

    if (!dependencyPath) continue;

    for (let specifier of importAst.specifiers) {
      if (!SPECIFIERS.has(specifier.type)) break;
      dependenciesMap.add(dependencyPath);
    }
  }

  return dependenciesMap;
}

function resolve(path: string, base: string) {
  if (AVOIDED_DEPENDENCIES.has(path)) return;
  try {
    return import.meta.resolveSync(path, base);
  } catch {
    // It is not exactly the same, it is only the same if it has
    // the format, otherwise it does not put the format, but
    // import.meta.resolveSync does. The import.meta.resolveSync
    // throws an exception if the file does not exist, but
    // import.meta.resolve does not check if it exists and resolves
    // the absolute path without resolving the format (.js|.ts|.tsx...)
    return Bun.fileURLToPath(import.meta.resolve(path, base));
  }
}
