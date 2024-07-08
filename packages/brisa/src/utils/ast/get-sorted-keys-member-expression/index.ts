export default function getSortedKeysMemberExpression(memberExpression: any) {
  const keys = [];
  let node = memberExpression;

  while (node.type === "MemberExpression") {
    if (node.property.type === "Identifier") {
      keys.push(node.property);
    }
    node = node.object;
  }

  if (node.type === "Identifier") keys.push(node);

  return keys.reverse();
}
