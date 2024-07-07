export default function skipPropTransformation(
  propsNamesAndRenamesSet: Set<string>,
) {
  return function traverseA2B(this: any, key: string, value: any) {
    if (this._skip && typeof value === "object" && value !== null) {
      if (!value._skip) value._skip = this._skip.slice();
    }

    if (value?.type === "VariableDeclaration" && Array.isArray(this)) {
      const skipArray = value?._skip?.slice() ?? [];

      for (const declaration of value.declarations) {
        if (
          declaration?.id?.type === "Identifier" &&
          propsNamesAndRenamesSet.has(declaration?.id?.name)
        ) {
          skipArray.push(declaration?.id.name);
        }
      }

      if (skipArray.length) {
        const index = this.findIndex((v: any) => v === value);
        // Update next siblings to skip
        for (let i = index + 1; i < this.length; i++) {
          this[i]._skip = skipArray;
        }
      }
    }

    return value;
  };
}
