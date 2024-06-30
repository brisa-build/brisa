type Options = {
  skipFirstLevel?: boolean;
};

const CONTENT_REGEX = /^\(\) =>(.*)\.$/;
const PATTERNS = new Set(["ObjectPattern", "ArrayPattern"]);

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

      if (element?.type === "RestElement") {
        if (options.skipFirstLevel && !acc) continue;
        const suffix = acc ? `.slice(${i})` : element?.argument?.name;
        result.push("() => " + acc + suffix);
        continue;
      }

      if (!PATTERNS.has(element?.type)) {
        if (options.skipFirstLevel && !acc) continue;
        const suffix = acc ? `[${i}]` : element?.name;
        result.push("() => " + acc + suffix);
        continue;
      }

      result.push(...patternToStringArrowFn(element, options, acc + `[${i}].`));
    }

    return result;
  }

  // ObjectPattern
  for (let prop of pattern.properties) {
    if (!PATTERNS.has(prop?.value?.type)) {
      if (options.skipFirstLevel && !acc) continue;

      // Transform
      //    from: { a: { b: { c, ...rest } } }
      //    to: () => { let { c, ...rest } = a.b; return rest;}
      if (prop?.type === "RestElement" && acc) {
        const rest = prop?.argument?.name;
        const content = acc.replace(/\.$/, "");
        const last: string = result.at(-1)?.split(/\.|\[/)?.at(-1) ?? "";

        result.push(
          `() => { let {${last}, ...${rest}} = ${content}; return ${rest}}`,
        );
        continue;
      }

      let suffix = prop?.value?.right ? ` ?? ${prop?.value?.right?.value}` : "";
      const name = prop?.key?.name ?? prop?.value?.name ?? prop?.argument?.name;
      result.push("() => " + acc + name + suffix);
      continue;
    }

    const suffix = prop?.value?.right ? ` ?? ${prop?.value?.right?.value}` : "";
    const dot = prop?.value?.type === "ArrayPattern" ? "" : ".";
    const newAcc = acc + prop?.key?.name + dot + suffix;
    result.push(...patternToStringArrowFn(prop?.value, options, newAcc));
  }

  return result;
}
