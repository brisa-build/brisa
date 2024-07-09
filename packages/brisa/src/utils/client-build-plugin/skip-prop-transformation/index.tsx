import getAllPatternNames from "@/utils/ast/get-all-pattern-names";
import getSortedKeysMemberExpression from "@/utils/ast/get-sorted-keys-member-expression";
import { FN } from "@/utils/client-build-plugin/constants";

const PROPS_OPTIMIZATION_IDENTIFIER = "__b_props__";

export default function skipPropTransformation(
  componentBody: any,
  propsNamesAndRenamesSet: Set<string>,
  propsIdentifier: string,
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

    // Skip "const {foo} = p.bar;" -> "const {foo: foo.value} = p.bar.value;"
    // Instead, we want: "const {foo} = p.bar;" -> "const {foo} = p.bar.value;"
    if (this?.type === "VariableDeclarator" && this.id === value) {
      value._force_skip = true;
      return value;
    }

    // Variable declaration
    if (
      value?.type === "VariableDeclaration" &&
      Array.isArray(this) &&
      this !== componentBody.body
    ) {
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
          const identifiers = getAllPatternNames(declaration.id);

          for (const identifier of identifiers) {
            if (propsNamesAndRenamesSet.has(identifier.name)) {
              Object.assign(identifier, { _force_skip: true });
              skipArray.push(identifier.name);
            }
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
          param._force_skip = true;
        }

        // Skip rest parameter
        else if (
          param?.type === "RestElement" &&
          param.argument?.type === "Identifier" &&
          propsNamesAndRenamesSet.has(param.argument.name)
        ) {
          skipArray.push(param.argument.name);
          param.argument._force_skip = true;
        }

        // Skip object or array pattern properties
        else if (
          param?.type === "ObjectPattern" ||
          param?.type === "ArrayPattern"
        ) {
          const identifiers = getAllPatternNames(param);

          for (const identifier of identifiers) {
            if (propsNamesAndRenamesSet.has(identifier.name)) {
              Object.assign(identifier, { _force_skip: true });
              skipArray.push(identifier.name);
            }
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

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (forceSkip) key._force_skip = true;

        const isPropName = propsNamesAndRenamesSet.has(key.name);

        if (i === 0) {
          if (
            (isPropName && !propsIdentifier) ||
            key.name === PROPS_OPTIMIZATION_IDENTIFIER ||
            (propsIdentifier && key.name === propsIdentifier)
          ) {
            forceSkip = isPropName;
          } else {
            forceSkip = true;
            key._force_skip = true;
          }
        } else if (isPropName) {
          forceSkip = true;
        }
      }
    }

    return value;
  };
}
