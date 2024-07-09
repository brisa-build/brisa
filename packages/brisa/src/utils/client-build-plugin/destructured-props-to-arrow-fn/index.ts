import AST from "@/utils/ast";

type Result = { arrow: string; name: string }[];

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
 *         - () => a.value.[0].b.c ?? "3"
 *         - () => f.value.g ?? "5"
 */
export default function destructuredPropsToArrowFn(
  inputPattern: any,
  prefix = "",
  acc = "",
): Result {
  const result: Result = [];
  const propsFirstLevel = [];
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
        element?.argument?.name ?? element?.left?.name ?? element?.name;

      // Skip first level
      if (!acc) {
        propsFirstLevel.push(name);
        continue;
      }

      /* ####################################################################
         #####     Transform RestElement from Array to an arrow fn     ######
         ####################################################################*/
      if (element?.type === "RestElement") {
        const dot = acc.at(-1) === "." ? "" : ".";
        const suffix = acc ? `${dot}slice(${i})` : name;
        result.push({ arrow: "() => " + acc + suffix, name });
        continue;
      }

      const last = acc.at(-1) === "." ? acc.slice(0, -1) : acc;

      /* #####################################################################
        #####      Transform ObjectPattern or ArrayPattern element      ######
        ####################################################################*/
      if (PATTERNS.has(element?.type)) {
        result.push(
          ...destructuredPropsToArrowFn(element, "", last + `[${i}].`),
        );
        continue;
      }

      /* #####################################################################
        #####        Transform Element from Array to an arrow fn        ######
        ####################################################################*/
      const suffix = `[${i}]${defaultValue.fallbackText}`;
      result.push({ arrow: "() => " + last + suffix, name });
    }

    return result;
  }

  // ##### ObjectPattern #####
  for (let prop of pattern?.properties ?? []) {
    const value = prop?.value;
    const right = prop?.value?.right;
    const type = prop?.value?.type;
    const defaultValue = getDefaultValue(right);
    const dotValueForDefault = defaultValue.isIdentifier ? ".value" : "";
    const propDefaultText = defaultValue.fallbackText + dotValueForDefault;
    const dotValue = acc ? "" : ".value";
    const name = prop?.key?.name ?? `["${prop?.key?.value}"]`;
    const hasDefaultObjectValue =
      !defaultValue.isLiteral && defaultValue.fallbackText;

    if (!acc) propsFirstLevel.push(name);

    /* ####################################################################
       #####     Transform ObjectPattern or ArrayPattern property    ######
       ####################################################################*/
    if (PATTERNS.has(type)) {
      const isArrayPattern = type === "ArrayPattern";
      const dot = isArrayPattern ? "" : ".";
      const updatedAcc = prop?.key?.name ? acc : acc.replace(DOT_END_REGEX, "");
      const { fallbackText } = getDefaultValue(inputPattern?.right, name);
      let newAcc = updatedAcc + prefix + name + dotValue;

      if (!acc && fallbackText) newAcc = `(${newAcc + fallbackText})`;
      newAcc += dot + propDefaultText;
      result.push(...destructuredPropsToArrowFn(value, "", newAcc));
      continue;
    }

    /* ####################################################################
       #####       Transform Property with default object/array       ######
       #####       value in top level                                 ######
       ####################################################################*/
    if (hasDefaultObjectValue && !acc) {
      const updatedAcc = prop?.key?.name ? acc : acc.replace(DOT_END_REGEX, "");
      let newAcc = updatedAcc + prefix + name + dotValue;

      newAcc = `(${newAcc + propDefaultText}).`;
      result.push(...destructuredPropsToArrowFn(value.left, "", newAcc));
      continue;
    }

    // Skip first level
    if (!acc) continue;

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
        arrow: `() => { let {${variables}, ...${rest}} = ${content}; return ${rest}}`,
        name: rest,
      });
      continue;
    }

    /* #############################################################
       ####### Transform Property from Object to an arrow fn #######
       #############################################################*/
    result.push({
      arrow: "() => " + acc + name + dotValue + propDefaultText,
      name: prop?.key?.name ?? value?.name ?? prop?.argument?.name,
    });
  }

  // ##### Remove .value from external identifiers default values #####
  if (!acc) {
    const allProps = new Set(propsFirstLevel);
    const allVarsWithDotValue = new Set();

    for (let i = 0; i < result.length; i++) {
      const { arrow, name } = result[i];
      allProps.add(name);
      const matched = arrow.replaceAll("(", "").match(/\S*\.value/g);

      for (let j = 0; matched && j < matched.length; j++) {
        let varName = matched[j].replace(".value", "");
        if (prefix) varName = varName.replace(prefix, "");
        allVarsWithDotValue.add(varName);
      }
    }

    // @ts-ignore Difference is already available in Bun but not in the types
    const difference = allVarsWithDotValue.difference(allProps);

    if (!difference.size) return result;

    return result.map((r) => ({
      name: r.name,
      arrow: r.arrow.replace(
        new RegExp(`(${Array.from(difference).join("|")})\\.value`, "g"),
        "$1",
      ),
    }));
  }

  return result;
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
