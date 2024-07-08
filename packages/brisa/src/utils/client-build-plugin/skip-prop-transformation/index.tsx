import getAllPatternNames from "@/utils/ast/get-all-pattern-names";
import getSortedKeysMemberExpression from "@/utils/ast/get-sorted-keys-member-expression";
import { FN } from "@/utils/client-build-plugin/constants";

export default function skipPropTransformation(
  propsNamesAndRenamesSet: Set<string>,
) {
  return function traverseA2B(this: any, key: string, value: any) {
    const isObject = typeof value === "object" && value !== null;

    // Force skip (for all properties)
    if (isObject && !value?._force_skip && this._force_skip) {
      value._force_skip = true;
      return value;
    }

    // Skip array of properties
    else if (isObject && !value._skip && this._skip) {
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
          const names = getAllPatternNames(declaration.id);

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
    else if (FN.has(value?.type)) {
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
          const names = getAllPatternNames(param);

          for (const name of names) {
            if (propsNamesAndRenamesSet.has(name)) skipArray.push(name);
          }
        }
      }

      if (skipArray.length) {
        value.body._skip = skipArray;
      }
    }

    // Member expression
    else if (value?.type === "MemberExpression") {
      const keys = getSortedKeysMemberExpression(value);
      let forceSkip = false;

      for (const key of keys) {
        if (forceSkip) key._force_skip = true;
        else if (propsNamesAndRenamesSet.has(key.name)) {
          forceSkip = true;
        }
      }
    }

    return value;
  };
}
