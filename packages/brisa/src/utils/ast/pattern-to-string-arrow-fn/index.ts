type Options = {
  skipFirstLevel?: boolean;
};

const PATTERNS = new Set(["ObjectPattern", "ArrayPattern"]);
const DEFAULT_VALUE_REGEX = / \?\?.*$/;
const SEPARATOR_REGEX = /\.|\[/;
const DOT_END_REGEX = /\.$/;

/**
 * Converts a pattern to a list of string arrow fn that can be used to access the
 * values of the pattern (used to keep reactivity on destructured props, using a
 * derived step).
 *
 * input:
 *         - { a: [{ b: {c = "3" }}], d, f: { g = "5" }}
 * outputs:
 *         - () => a[0].b.c ?? "3"
 *         - () => d (only when skipFirstLevel is false)
 *         - () => f.g ?? "5"
 */
export default function patternToStringArrowFn(
  pattern: any,
  options: Options = {},
  acc = "",
): string[] {
  const result = [];

  // ArrayPattern
  if (pattern.elements) {
    for (let i = 0; i < pattern.elements.length; i++) {
      const element = pattern.elements[i];

      // Skip first level
      if (options.skipFirstLevel && !acc) continue;

      // Transform RestElement from Array to an arrow fn
      if (element?.type === "RestElement") {
        const suffix = acc ? `.slice(${i})` : element?.argument?.name;
        result.push("() => " + acc + suffix);
        continue;
      }

      const last = acc.at(-1) === "." ? acc.slice(0, -1) : acc;

      // Element is an ObjectPattern or ArrayPattern
      if (PATTERNS.has(element?.type)) {
        result.push(
          ...patternToStringArrowFn(element, options, last + `[${i}].`),
        );
        continue;
      }

      // Transform Element from Array to an arrow fn
      const suffix = acc ? `[${i}]` : element?.name;
      result.push("() => " + last + suffix);
    }

    return result;
  }

  // ObjectPattern
  for (let prop of pattern.properties) {
    // Property is an ObjectPattern or ArrayPattern
    if (PATTERNS.has(prop?.value?.type)) {
      const suffix = prop?.value?.right
        ? ` ?? ${prop?.value?.right?.value}`
        : "";

      const isArrayPattern = prop?.value?.type === "ArrayPattern";
      const dot = isArrayPattern ? "" : ".";
      const name = prop?.key?.name ?? `["${prop?.key?.value}"]`;
      const updatedAcc = prop?.key?.name ? acc : acc.replace(DOT_END_REGEX, "");
      const newAcc = updatedAcc + name + dot + suffix;

      result.push(...patternToStringArrowFn(prop?.value, options, newAcc));
      continue;
    }

    // Skip first level
    if (options.skipFirstLevel && !acc) continue;

    // Transform RestElement from Object to an arrow fn
    //    from: { a: { b: { c, ...rest } } }
    //    to: () => { let { c, ...rest } = a.b; return rest;}
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

    // Transform Property from Object to an arrow fn
    let defaultValue = prop?.value?.right?.value;

    // Literal values arrives with original format (1, "1"...)
    if (defaultValue && typeof defaultValue === "string") {
      defaultValue = `"${defaultValue}"`;
    }

    let suffix = prop?.value?.right ? ` ?? ${defaultValue}` : "";
    const name = prop?.key?.name ?? prop?.value?.name ?? prop?.argument?.name;
    result.push("() => " + acc + name + suffix);
  }

  return result;
}
