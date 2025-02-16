import type { ESTree } from 'meriyah';

const DECLARATORS = new Set(['VariableDeclarator', 'FunctionDeclaration']);

export default function getVarDeclarationIdentifiers(node: ESTree.Node) {
  const identifiers = new Map<string, Set<string>>();

  if (!node) return identifiers;

  function getIdentifiersDependenciesOn(node: ESTree.Node) {
    const deps = new Set<string>();

    JSON.stringify(node, function (k, v) {
      if (v?.type === 'Identifier' && this?.property !== v) {
        deps.add(v.name);
        if (identifiers.has(v.name)) {
          for (const dep of identifiers.get(v.name)!) {
            deps.add(dep);
          }
        }
      }

      return v;
    });

    return deps;
  }

  JSON.stringify(node, (k, v) => {
    if (v?.type === 'IfStatement') {
      const deps = getIdentifiersDependenciesOn(v.test);

      // Add all condition dependencies when in the condition
      // there is an existing identifier #712
      for (const dep of deps) {
        if (!identifiers.has(dep)) continue;

        const identifierDeps = identifiers.get(dep)!;
        const all = getIdentifiersDependenciesOn(v);

        // Add all dependencies except the current
        for (const value of all) value !== dep && identifierDeps.add(value);
      }
    }

    if (!DECLARATORS.has(v?.type)) return v;

    if (v.id.type === 'ObjectPattern') {
      for (const property of v.id.properties) {
        identifiers.set(
          property.key.name,
          getIdentifiersDependenciesOn(property.value),
        );
      }
    } else if (v.id.type === 'Identifier') {
      identifiers.set(v.id.name, getIdentifiersDependenciesOn(v.init!));
    }

    return v;
  });

  return identifiers;
}
