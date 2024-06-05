import type { ESTree } from "meriyah";

const SPECIFIERS = new Set(["ImportDefaultSpecifier", "ImportSpecifier"]);
const AVOIDED_DEPENDENCIES = new Set(["brisa", "brisa/server", "brisa/client"]);

export default function getDependenciesList(ast: ESTree.Program, path: string) {
  const dependenciesMap = new Set<string>();

  for (let importAst of ast.body) {
    if (importAst.type !== "ImportDeclaration") continue;

    for (let specifier of importAst.specifiers) {
      if (!SPECIFIERS.has(specifier.type)) continue;

      const dependencyPath = resolve(importAst.source.value as string, path);

      if (dependencyPath) dependenciesMap.add(dependencyPath);
    }
  }

  return dependenciesMap;
}

function resolve(path: string, base: string) {
  if (AVOIDED_DEPENDENCIES.has(path)) return;
  try {
    return import.meta.resolveSync(path, base);
  } catch {
    return Bun.fileURLToPath(import.meta.resolve(path, base));
  }
}
