export default function getAllPatternNames(
  pattern: any,
  names = new Set<string>(),
) {
  const isObjectPattern = pattern?.type === "ObjectPattern";

  if (!isObjectPattern && pattern?.type !== "ArrayPattern") {
    return names;
  }

  const iterable = isObjectPattern ? pattern.properties : pattern.elements;

  for (const item of iterable) {
    const element = isObjectPattern ? item.value : item;

    if (element === null) {
      continue;
    } else if (item.type === "RestElement") {
      names.add(item.argument.name);
    } else if (
      element.type === "ObjectPattern" ||
      element.type === "ArrayPattern"
    ) {
      getAllPatternNames(element, names);
    } else if (element.type === "AssignmentPattern") {
      names.add(element.left.name);
    } else {
      names.add(element.name);
    }
  }

  return names;
}
