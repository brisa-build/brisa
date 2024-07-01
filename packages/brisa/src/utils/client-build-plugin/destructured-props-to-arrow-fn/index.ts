import AST from "@/utils/ast";

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
  acc = "",
): string[] {
  const result = [];
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

      // Skip first level
      if (!acc) continue;

      /* ####################################################################
         #####     Transform RestElement from Array to an arrow fn     ######
         ####################################################################*/
      if (element?.type === "RestElement") {
        const suffix = acc ? `.slice(${i})` : element?.argument?.name;
        result.push("() => " + acc + suffix);
        continue;
      }

      const last = acc.at(-1) === "." ? acc.slice(0, -1) : acc;

      /* #####################################################################
        #####      Transform ObjectPattern or ArrayPattern element      ######
        ####################################################################*/
      if (PATTERNS.has(element?.type)) {
        result.push(...destructuredPropsToArrowFn(element, last + `[${i}].`));
        continue;
      }

      /* #####################################################################
        #####        Transform Element from Array to an arrow fn        ######
        ####################################################################*/
      const suffix = `[${i}]${defaultValue.fallbackText}`;
      result.push("() => " + last + suffix);
    }

    return result;
  }

  // ##### ObjectPattern #####
  for (let prop of pattern?.properties ?? []) {
    const value = prop?.value;
    const right = prop?.value?.right;
    const defaultValue = getDefaultValue(right);

    /* ####################################################################
       #####     Transform ObjectPattern or ArrayPattern property    ######
       ####################################################################*/
    if (PATTERNS.has(prop?.value?.type)) {
      const isArrayPattern = prop?.value?.type === "ArrayPattern";
      const dot = isArrayPattern ? "" : ".";
      const name = prop?.key?.name ?? `["${prop?.key?.value}"]`;
      const updatedAcc = prop?.key?.name ? acc : acc.replace(DOT_END_REGEX, "");
      const dotValue = acc ? "" : ".value";
      const { fallbackText } = getDefaultValue(inputPattern?.right);
      let newAcc = updatedAcc + name + dotValue;

      if (!acc && fallbackText) newAcc = `(${newAcc + fallbackText})`;
      newAcc += dot + defaultValue.fallbackText;
      result.push(...destructuredPropsToArrowFn(prop?.value, newAcc));
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
        const splitted = result[i]
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
      result.push(
        `() => { let {${variables}, ...${rest}} = ${content}; return ${rest}}`,
      );
      continue;
    }

    /* #############################################################
       ####### Transform Property from Object to an arrow fn #######
       #############################################################*/
    let name = prop?.key?.name ?? value?.name ?? prop?.argument?.name;
    result.push("() => " + acc + name + defaultValue.fallbackText);
  }

  return result;
}

function getDefaultValue(right: any) {
  const isLiteral = right?.type === "Literal";
  const text = right ? generateCodeFromAST(right) : null;
  const fallbackText = text ? ` ?? ${text}` : "";

  return { fallbackText, isLiteral };
}
