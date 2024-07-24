import type { ESTree } from 'meriyah';

export default function getAllPatternNames(
  pattern: any,
  namesIdentifiers = new Set<ESTree.Identifier>(),
) {
  const isObjectPattern = pattern?.type === 'ObjectPattern';

  if (!isObjectPattern && pattern?.type !== 'ArrayPattern') {
    return namesIdentifiers;
  }

  const iterable = isObjectPattern ? pattern.properties : pattern.elements;

  for (const item of iterable) {
    const element = isObjectPattern ? item.value : item;

    if (element === null) {
      continue;
    } else if (item.type === 'RestElement') {
      namesIdentifiers.add(item.argument);
    } else if (element.type === 'ObjectPattern' || element.type === 'ArrayPattern') {
      getAllPatternNames(element, namesIdentifiers);
    } else if (element.type === 'AssignmentPattern') {
      namesIdentifiers.add(element.left);
    } else {
      namesIdentifiers.add(element);
    }
  }

  return namesIdentifiers;
}
