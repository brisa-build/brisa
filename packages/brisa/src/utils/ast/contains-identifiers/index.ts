import type { ESTree } from 'meriyah';

export default function containsIdentifiers(node: ESTree.Node, identifiers: Set<string>) {
  let contains = false;

  JSON.stringify(node, function (k, v) {
    // Avoid: "await fetch(url)" even containing identifiers
    // Keep: "const response = await fetch(url)", if "response" is in the identifiers
    if (
      v?.type === 'AwaitExpression' &&
      (this?.type !== 'VariableDeclarator' || !identifiers.has(this.id.name))
    ) {
      return;
    }

    // Avoid: "someMagicFunction(foo)" even containing identifiers
    if (v?.type === 'CallExpression' && this?.type === 'ExpressionStatement') {
      return;
    }

    if (v?.type === 'Identifier' && identifiers.has(v.name)) {
      contains = true;
    }

    return v;
  });

  return contains;
}
