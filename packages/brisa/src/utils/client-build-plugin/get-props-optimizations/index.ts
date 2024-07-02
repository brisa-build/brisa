import AST from "@/utils/ast";

type Result = { arrow: string; name: string }[];

type Vars = {
  dotValueList: Set<string>;
  propsList: Set<string>;
};

const PROPS_IDENTIFIER = "__b_props__";
const PATTERNS = new Set(["ObjectPattern", "ArrayPattern"]);
const DEFAULT_VALUE_REGEX = / \?\?.*$/;
const SEPARATOR_REGEX = /\.|\[/;
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
 *         - () => __b_props__.a.value.[0].b.c ?? "3"
 *         - () => __b_props__.f.value.g ?? "5"
 */
export default function getPropsOptimizations(
  inputPattern: any,
  acc = "",
  vars: Vars = {
    dotValueList: new Set(),
    propsList: new Set(),
  },
): Result {
  const result: Result = [];
  let pattern = inputPattern;

  // ##### AssignmentPattern (with default value in top level) #####
  if (pattern?.type === "AssignmentPattern") {
    pattern = pattern.left;
  }

  // ##### ArrayPattern #####
  if (pattern.elements) {
    for (let i = 0; i < pattern.elements.length; i++) {
      const element = pattern.elements[i];
      const right = element?.right;
      const defaultValue = getDefaultValue(right);
      const name =
        element?.left?.name ?? element?.argument?.name ?? element?.name;

      // Track existing prop name
      vars.propsList.add(name);

      // Skip first level
      if (!acc && !defaultValue.fallbackText) continue;

      /* ####################################################################
         #####     Transform RestElement from Array to an arrow fn     ######
         ####################################################################*/
      if (element?.type === "RestElement") {
        const dot = acc.at(-1) === "." ? "" : ".";
        const suffix = acc ? `${dot}slice(${i})` : name;

        result.push({ arrow: `() => ${addPrefix(acc + suffix)}`, name });
        continue;
      }

      const last = acc.at(-1) === "." ? acc.slice(0, -1) : acc;

      /* #####################################################################
        #####      Transform ObjectPattern or ArrayPattern element      ######
        ####################################################################*/
      if (PATTERNS.has(element?.type)) {
        result.push(...getPropsOptimizations(element, last + `[${i}].`, vars));
        continue;
      }

      /* #####################################################################
        #####        Transform Element from Array to an arrow fn        ######
        ####################################################################*/
      const suffix = `[${i}]${defaultValue.fallbackText}`;
      result.push({ arrow: "() => " + addPrefix(last + suffix), name });
    }

    return result;
  }

  // ##### ObjectPattern #####
  for (let prop of pattern?.properties ?? []) {
    const value = prop?.value;
    const right = value?.right;
    const type = value?.type;
    const name =
      value?.left?.name ??
      value?.name ??
      prop?.key?.name ??
      `["${value?.value ?? prop?.key?.value}"]`;

    const defaultValue = getDefaultValue(right);
    const dotValueForDefault = defaultValue.isIdentifier ? ".value" : "";
    const propDefaultText = defaultValue.fallbackText + dotValueForDefault;
    const dotValue = acc ? "" : ".value";
    const hasDefaultObjectValue =
      !defaultValue.isLiteral && defaultValue.fallbackText;

    // Track existing prop name + vars with .value (including default values)
    vars.propsList.add(name);
    if (acc) {
      if (dotValue) vars.dotValueList.add(name);
      if (dotValueForDefault) vars.dotValueList.add(right?.name);
    }

    /* ####################################################################
       #####     Transform ObjectPattern or ArrayPattern property    ######
       ####################################################################*/
    if (PATTERNS.has(type)) {
      const isArrayPattern = type === "ArrayPattern";
      const dot = isArrayPattern ? "" : ".";
      const updatedAcc = prop?.key?.name ? acc : acc.replace(DOT_END_REGEX, "");
      const { fallbackText } = getDefaultValue(inputPattern?.right, name);
      let newAcc = updatedAcc + name + dotValue;

      if (!acc && fallbackText) newAcc = `(${newAcc + fallbackText})`;
      newAcc += dot + propDefaultText;
      result.push(...getPropsOptimizations(value, newAcc, vars));
      continue;
    }

    /* ####################################################################
       #####       Transform Property with default object/array       ######
       #####       value in top level                                 ######
       ####################################################################*/
    if (hasDefaultObjectValue && !acc) {
      const updatedAcc = prop?.key?.name ? acc : acc.replace(DOT_END_REGEX, "");
      let newAcc = updatedAcc + name + dotValue;

      if (value.left?.type === "Identifier") {
        result.push({
          arrow: `() => ${addPrefix(newAcc + propDefaultText)}`,
          name: value.left?.name,
        });
        continue;
      }

      newAcc = `(${newAcc + propDefaultText}).`;
      result.push(...getPropsOptimizations(value.left, newAcc, vars));
      continue;
    }

    // Skip first level
    if (!acc && !propDefaultText) continue;

    /*
       ####################################################################
       #####  Transform RestElement from Object to an arrow fn       ######
       #####                                                         ######
       #####  From:  from: { a: { b: { c, ...rest } } }              ######
       #####  To: () => {let {c, ...rest} = a.value.b; return rest;} ######
       ####################################################################
    */
    if (prop?.type === "RestElement" && acc) {
      const rest = prop?.argument?.name;
      const content = acc.replace(DOT_END_REGEX, "");
      let common;
      let commonLength;
      let items: string[] = [];

      for (let i = result.length - 1; i >= 0; i--) {
        const splitted = result[i]?.arrow
          ?.replace(DEFAULT_VALUE_REGEX, "")
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
      result.push({
        arrow: `() => { let {${variables}, ...${rest}} = ${addPrefix(
          content,
        )}; return ${rest}}`,
        name: rest,
      });
      continue;
    }

    /* #############################################################
       ####### Transform Property from Object to an arrow fn #######
       #############################################################*/
    result.push({
      arrow: `() => ${addPrefix(acc + name + dotValue + propDefaultText)}`,
      name,
    });
  }

  if (acc) return result;

  // @ts-ignore Difference is already available in Bun but not in the types
  const difference = vars.dotValueList.difference(vars.propsList);

  if (!difference.size) return result;

  // ##### Remove .value from external identifiers default values #####
  return result.map((r) => ({
    name: r.name,
    arrow: r.arrow.replace(
      new RegExp(`(${Array.from(difference).join("|")})\\.value`, "g"),
      "$1",
    ),
  }));
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
  let prefix = name.startsWith("[") ? PROPS_IDENTIFIER : PROPS_IDENTIFIER + ".";

  return name.startsWith("(") ? "(" + prefix + name.slice(1) : prefix + name;
}
