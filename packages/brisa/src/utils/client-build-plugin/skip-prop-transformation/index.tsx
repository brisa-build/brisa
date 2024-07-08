import { FN } from "@/utils/client-build-plugin/constants";

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

    // Variable declaration
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

        // Skip object or array pattern properties
        else if (
          declaration?.id?.type === "ObjectPattern" ||
          declaration?.id?.type === "ArrayPattern"
        ) {
          const names = getAllPatternNamesRecursive(declaration.id);

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

    // Function parameters and skip on the fn body
    if (FN.has(value?.type)) {
      const skipArray = value?._skip?.slice() ?? [];

      for (const param of value.params) {
        // Skip function parameters
        if (
          param?.type === "Identifier" &&
          propsNamesAndRenamesSet.has(param.name)
        ) {
          skipArray.push(param.name);
        }

        // Skip object or array pattern properties
        else if (
          param?.type === "ObjectPattern" ||
          param?.type === "ArrayPattern"
        ) {
          const names = getAllPatternNamesRecursive(param);

          for (const name of names) {
            if (propsNamesAndRenamesSet.has(name)) skipArray.push(name);
          }
        }
      }

      if (skipArray.length) {
        value.body._skip = skipArray;
      }
    }

    return value;
  };
}

function getAllPatternNamesRecursive(pattern: any, names = new Set<string>()) {
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
      getAllPatternNamesRecursive(element, names);
    } else if (element.type === "AssignmentPattern") {
      names.add(element.left.name);
    } else {
      names.add(element.name);
    }
  }

  return names;
}
