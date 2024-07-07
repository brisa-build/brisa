export default function skipPropTransformation(
  propsNamesAndRenamesSet: Set<string>,
) {
  return function traverseA2B(this: any, key: string, value: any) {
    if (
      !value._skip &&
      this._skip &&
      typeof value === "object" &&
      value !== null
    ) {
      value._skip = this._skip.slice();
    }

    if (value?.type === "VariableDeclaration" && Array.isArray(this)) {
      const skipArray = value?._skip?.slice() ?? [];

      for (const declaration of value.declarations) {
        // Skip variable declarations
        if (
          declaration?.id?.type === "Identifier" &&
          propsNamesAndRenamesSet.has(declaration?.id?.name)
        ) {
          skipArray.push(declaration?.id.name);
        }

        // Skip object pattern properties
        if (declaration?.id?.type === "ObjectPattern") {
          const names = getAllObjectPatternNamesRecursive(declaration?.id);

          for (const name of names) {
            if (propsNamesAndRenamesSet.has(name)) skipArray.push(name);
          }
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

function getAllObjectPatternNamesRecursive(
  objectPattern: any,
  names = new Set<string>(),
) {
  if (objectPattern?.type !== "ObjectPattern") return names;

  for (const prop of objectPattern.properties) {
    if (prop.type === "RestElement") {
      getAllObjectPatternNamesRecursive(prop.argument, names);
    } else {
      names.add(prop.value.name);
    }
  }

  return names;
}
