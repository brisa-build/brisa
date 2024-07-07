export default function skipPropTransformation(
  propsNamesAndRenamesSet: Set<string>,
) {
  return function traverseA2B(this: any, key: string, value: any) {
    if (this._skip && typeof value === "object" && value !== null) {
      value._skip = this._skip;
      return value;
    }

    if (
      value?.type !== "VariableDeclaration" &&
      value?.type !== "FunctionDeclaration"
    ) {
      return value;
    }

    if (value?.type === "VariableDeclaration") {
      const skipArray = value?._skip ?? [];

      for (const declaration of value.declarations) {
        if (
          declaration?.id?.type === "Identifier" &&
          propsNamesAndRenamesSet.has(declaration?.id?.name)
        ) {
          skipArray.push(declaration?.id.name);
          declaration.id._skip = skipArray;
        }
      }
    }

    return value;
  };
}
