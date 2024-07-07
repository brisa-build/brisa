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

        // Skip object pattern properties
        if (declaration?.id?.type === "ObjectPattern") {
          const names = getAllObjectPatternNamesRecursive(declaration?.id);

          for (const name of names) {
            if (propsNamesAndRenamesSet.has(name)) skipArray.push(name);
          }
        }

        // Skip array pattern elements
        if (declaration?.id?.type === "ArrayPattern") {
          const names = getAllArrayPatternNamesRecursive(declaration?.id);

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
        if (propsNamesAndRenamesSet.has(param.name)) {
          skipArray.push(param.name);
        }
      }

      if (skipArray.length) {
        value.body._skip = skipArray;
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
      names.add(prop.argument.name);
    } else if (prop.value.type === "ObjectPattern") {
      getAllObjectPatternNamesRecursive(prop.value, names);
    } else {
      names.add(prop.value.name);
    }
  }

  return names;
}

function getAllArrayPatternNamesRecursive(
  arrayPattern: any,
  names = new Set<string>(),
) {
  if (arrayPattern?.type !== "ArrayPattern") return names;

  for (const element of arrayPattern.elements) {
    if (element === null) {
      continue;
    } else if (element.type === "RestElement") {
      names.add(element.argument.name);
    } else if (element.type === "ArrayPattern") {
      getAllArrayPatternNamesRecursive(element, names);
    } else if (element.type === "ObjectPattern") {
      getAllObjectPatternNamesRecursive(element, names);
    } else {
      names.add(element.name);
    }
  }

  return names;
}
