export function getInitialMemberExpression(memberExpression: any): any {
  if (memberExpression?.object?.type === "LogicalExpression") {
    return getInitialMemberExpression(memberExpression.object.left);
  }

  if (memberExpression?.type === "ChainExpression") {
    return getInitialMemberExpression(memberExpression.expression);
  }

  if (memberExpression?.object?.type === "MemberExpression") {
    return getInitialMemberExpression(memberExpression.object);
  }

  return memberExpression;
}
