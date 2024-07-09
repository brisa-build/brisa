import AST from "@/utils/ast";

const PROPS_IDENTIFIER = "__b_props__";
const PATTERNS = new Set(["ObjectPattern", "ArrayPattern"]);
const EXTRA_END_REGEX = /( \?\?.*|\);)$/;
const DEP_REGEX = /\?\? ([a-z|A-Z|_]*)\)\;$/;
const BEFORE_ARROW_REGEX = /.*\(\) => /;
const SEPARATOR_REGEX = /\.|\[/;
const OPEN_PARENTHESIS_REGEX = /^\(*/;
const DOT_END_REGEX = /\.$/;
const { generateCodeFromAST } = AST("tsx");

/**
 * Converts a pattern to a list of string arrow fn that can be used to access the
 * values of the pattern (used to keep reactivity on destructured props, using a
 * derived step).
 *
 * input:
 *         - { a: [{ b: {c = "3" }}], d, f: { g = "5" }}
 * outputs:
 *         - const c = derived(() => __b_props__.a[0].b.c ?? "3");
 *         - const g = derived(() => __b_props__.fg ?? "5");
 */
export default function getPropsOptimizations(
  inputPattern: any,
  derivedFnName: string,
  acc = "",
): string[] {
  const result: string[] = [];
  let pattern = inputPattern;

  // from: { a: { b: { c = "3" }, b } }
  // - firstLevelVars: { b }
  // - firstLevelFields: { a, b }
  const firstLevelVars: string[] = [];
  const firstLevelFields: string[] = [];

  // AssignmentPattern (with default value in top level)
  if (pattern?.type === "AssignmentPattern") {
    pattern = pattern.left;
  }

  // ArrayPattern
  if (pattern?.elements) {
    for (let i = 0; i < pattern.elements.length; i++) {
      const element = pattern.elements[i];
      const right = element?.right;
      const isRest = element?.type === "RestElement";
      const defaultValue = getDefaultValue(right);
      const name =
        element?.left?.name ?? element?.argument?.name ?? element?.name;

      // Skip first level without default value
      if (!acc) {
        firstLevelFields.push(name);
        if (!defaultValue.fallbackText) {
          firstLevelVars.push(name);
          continue;
        }
      }

      /* ####################################################################
         #####     Transform RestElement from Array to an arrow fn     ######
         ####################################################################*/
      if (isRest) {
        const dot = acc.at(-1) === "." ? "" : ".";
        const suffix = acc ? `${dot}slice(${i})` : name;
        const res = getDerivedArrowFnString(
          name,
          addPrefix(acc + suffix),
          derivedFnName,
        );

        result.push(res);
        continue;
      }

      const last = acc.at(-1) === "." ? acc.slice(0, -1) : acc;

      /* #####################################################################
        #####      Transform ObjectPattern or ArrayPattern element      ######
        ####################################################################*/
      if (PATTERNS.has(element?.type)) {
        result.push(
          ...getPropsOptimizations(element, derivedFnName, last + `[${i}].`),
        );
        continue;
      }

      /* #####################################################################
        #####        Transform Element from Array to an arrow fn        ######
        ####################################################################*/
      const suffix = `[${i}]${defaultValue.fallbackText}`;
      const res = getDerivedArrowFnString(
        name,
        addPrefix(last + suffix),
        derivedFnName,
      );

      result.push(res);
    }

    return result;
  }

  // ObjectPattern
  for (let prop of pattern?.properties ?? []) {
    const value = prop?.value;
    const right = value?.right;
    const type = value?.type;
    const isRest = prop?.type === "RestElement";
    const { name, keyName } = getPropertyNames(prop);
    const isKeyLiteral = prop?.key?.type === "Literal";
    const isKeyStringLiteral = isKeyLiteral && typeof keyName === "string";
    const quotes = isKeyStringLiteral ? `"` : "";
    const isRenamed = name !== keyName;
    const field = isRenamed ? `${quotes}${keyName}${quotes}:${name}` : name;
    const defaultValue = getDefaultValue(right);
    const propDefaultText = defaultValue.fallbackText;
    const hasDefaultObjectValue =
      !defaultValue.isLiteral && defaultValue.fallbackText;

    if (!acc) {
      firstLevelFields.push(isRest ? `...${prop?.argument?.name}` : field);
    }

    /* ####################################################################
       #####     Transform ObjectPattern or ArrayPattern property    ######
       ####################################################################*/
    if (PATTERNS.has(type)) {
      const isArrayPattern = type === "ArrayPattern";
      const dot = isArrayPattern ? "" : ".";
      const updatedAcc = prop?.key?.name ? acc : acc.replace(DOT_END_REGEX, "");
      const { fallbackText } = getDefaultValue(inputPattern?.right, name);
      let newAcc = updatedAcc + name;

      if (!acc && fallbackText) newAcc = `(${newAcc + fallbackText})`;
      newAcc += dot + propDefaultText;
      result.push(...getPropsOptimizations(value, derivedFnName, newAcc));
      continue;
    }

    /* ####################################################################
       #####       Transform Property with default                   ######
       #####       object/array value                                ######
       ####################################################################*/
    if (hasDefaultObjectValue) {
      const updatedAcc = prop?.key?.name ? acc : acc.replace(DOT_END_REGEX, "");
      let newAcc = updatedAcc + keyName;

      if (value.left?.type === "Identifier") {
        const res = getDerivedArrowFnString(
          value.left?.name,
          addPrefix(newAcc + propDefaultText),
          derivedFnName,
        );

        result.push(res);
        continue;
      }

      newAcc = `(${newAcc + propDefaultText}).`;

      result.push(...getPropsOptimizations(value.left, derivedFnName, newAcc));
      continue;
    }

    // Skip first level without default value
    if (!acc && !propDefaultText) {
      if (!isRest) firstLevelVars.push(field);
      continue;
    }

    /*
       ####################################################################
       #####  Transform RestElement from Object to an arrow fn       ######
       #####                                                         ######
       #####  From:  from: { a: { b: { c, ...rest } } }              ######
       #####  To:                                                    ######
       ######     const rest = derived(() => {                       ######
       ######       let {c, ...rest} = a.value.b;                    ######
       ######       return rest;                                     ######
       ######     });                                                ######
       ####################################################################
    */
    if (isRest && acc) {
      const rest = prop?.argument?.name;
      const content = acc.replace(DOT_END_REGEX, "");
      let common;
      let commonLength;
      let items: string[] = [];

      for (let i = result.length - 1; i >= 0; i--) {
        const splitted = result[i]
          ?.replace(EXTRA_END_REGEX, "")
          ?.replace(BEFORE_ARROW_REGEX, "() => ")
          ?.split(SEPARATOR_REGEX);

        if (!common) {
          common = splitted.slice(0, -1);
          commonLength = common.length;
          items.unshift(splitted.at(-1)!);
          continue;
        }

        const size = commonLength! - splitted.length;

        if (common.join() !== splitted.slice(0, size).join()) {
          break;
        }

        items.unshift(splitted.at(size)!);
      }

      const variables = items.join(", ");
      const res = getDerivedArrowFnString(
        rest,
        `(({${variables}, ...${rest}}) => ${rest})(${addPrefix(content)})`,
        derivedFnName,
      );

      result.push(res);
      continue;
    }

    /* ####################################################################
        #####    Transform ObjectPattern property with default value   ######
        ####################################################################*/
    if (
      value?.type === "AssignmentPattern" &&
      value?.left?.type === "ObjectPattern"
    ) {
      result.push(
        ...getPropsOptimizations(value.left, derivedFnName, acc + name + "."),
      );
      continue;
    }

    /* #############################################################
       ####### Transform Property from Object to an arrow fn #######
       #############################################################*/
    const consumingKeyText = isKeyLiteral ? `["${keyName}"]` : keyName;
    const formattedAcc = isKeyLiteral ? acc.replace(DOT_END_REGEX, "") : acc;
    const res = getDerivedArrowFnString(
      name,
      addPrefix(formattedAcc + consumingKeyText + propDefaultText),
      derivedFnName,
    );
    result.push(res);
  }

  if (acc || !result.length) return result;

  /* ##################################################################
     ##### Sort, complete and clean the result (end of recursion) #####
     ##################################################################*/
  const sortedResult = result.toSorted(sortByPropDependencies());

  if (firstLevelFields.at(-1)?.startsWith("...")) {
    const rest = firstLevelFields.at(-1)?.replace("...", "");
    sortedResult.unshift(
      `const ${rest} = (({${firstLevelFields.join(
        ", ",
      )}}) => ${rest})(__b_props__);`,
    );
  }

  if (firstLevelVars.length) {
    sortedResult.unshift(`const {${firstLevelVars.join(", ")}} = __b_props__;`);
  }

  return sortedResult;
}

function getDefaultValue(inputRight: any, name?: string) {
  const right = name
    ? inputRight?.properties?.find((p: any) => p.key?.name === name)?.value
    : inputRight;
  const text = right ? generateCodeFromAST(right) : null;

  return {
    fallbackText: text ? ` ?? ${text}` : "",
    isLiteral: right?.type === "Literal",
    isIdentifier: right?.type === "Identifier",
  };
}

function addPrefix(name: string): string {
  const openParenthesis = name.match(OPEN_PARENTHESIS_REGEX)?.[0];
  let prefix = name.startsWith("[") ? PROPS_IDENTIFIER : PROPS_IDENTIFIER + ".";

  return openParenthesis
    ? openParenthesis + prefix + name.replace(openParenthesis, "")
    : prefix + name;
}

function getDerivedArrowFnString(
  name: string,
  arrowContent: string,
  derivedFnName: string,
) {
  return `const ${name} = ${derivedFnName}(() => ${arrowContent});`;
}

function getPropDependency(code: string) {
  const dep = code.match(DEP_REGEX)?.[1];
  return dep ? new Set([dep]) : new Set();
}

function sortByPropDependencies() {
  let depsSet = new Set<string>();

  return (a: string, b: string) => {
    const aDeps = getPropDependency(a);
    const bDeps = getPropDependency(b);
    const unionWithA = depsSet.union(aDeps);
    const unionWithB = depsSet.union(bDeps);
    let result = 0;

    if (!bDeps.size && !aDeps.size) return result;

    if (!aDeps.size) result = -1;
    else if (!bDeps.size) result = 1;
    else if (unionWithA.size === aDeps.size && unionWithB.size !== bDeps.size) {
      result = 1;
    } else if (
      unionWithA.size !== aDeps.size &&
      unionWithB.size === bDeps.size
    ) {
      result = -1;
    }

    depsSet = unionWithA.union(unionWithB);

    return result;
  };
}

function getPropertyNames(prop: any) {
  let name =
    prop?.value?.left?.name ??
    prop?.value?.name ??
    prop?.key?.name ??
    `["${prop?.value?.value ?? prop?.key?.value}"]`;

  const keyName = prop?.key?.name ?? prop?.key?.value ?? name;

  return { name, keyName };
}
