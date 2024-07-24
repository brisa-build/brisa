export default function getSortedKeysMemberExpression(memberExpression: any) {
  const keys = [];
  let node = memberExpression;

  while (node.type === 'MemberExpression' || node.type === 'LogicalExpression') {
    if (node.property?.type === 'Identifier') {
      keys.push(node.property);
    } else if (node.type === 'Identifier') {
      keys.push(node);
    }
    node = node.object ?? node.left;
  }

  if (node.type === 'Identifier') keys.push(node);

  return keys.reverse();
}
