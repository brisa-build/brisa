import AST from "@/utils/ast";

type Vars = {
  dotValueList: Set<string>;
  propsList: Set<string>;
};

const PROPS_IDENTIFIER = "__b_props__";
const DOT_VALUE_TEXT = ".value";
const PATTERNS = new Set(["ObjectPattern", "ArrayPattern"]);
const EXTRA_END_REGEX = /( \?\?.*|\);)$/;
const BEFORE_ARROW_REGEX = /.*\(\) => /;
const SEPARATOR_REGEX = /\.|\[/;
const PROP_DEPENDENCY_REGEX = /(\S*)\.value/g;
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
 *         - const c = derived(() => __b_props__.a.value.[0].b.c ?? "3");
 *         - const g = derived(() => __b_props__.f.value.g ?? "5");
 */
export default function getPropsOptimizations(
  inputPattern: any,
  derivedFnName: string,
  acc = "",
  vars: Vars = {
    dotValueList: new Set(),
    propsList: new Set(),
  },
): string[] {
  const result: string[] = [];
  const firstLevelVars: string[] = [];
  let pattern = inputPattern;

  // AssignmentPattern (with default value in top level)
  if (pattern?.type === "AssignmentPattern") {
    pattern = pattern.left;
  }

  // ArrayPattern
  if (pattern.elements) {
    for (let i = 0; i < pattern.elements.length; i++) {
      const element = pattern.elements[i];
      const right = element?.right;
      const defaultValue = getDefaultValue(right);
      const name =
        element?.left?.name ?? element?.argument?.name ?? element?.name;

      // Track existing prop name
      vars.propsList.add(name);

      // Skip first level without default value
      if (!acc && !defaultValue.fallbackText && name) {
        firstLevelVars.push(name);
        continue;
      }

      /* ####################################################################
         #####     Transform RestElement from Array to an arrow fn     ######
         ####################################################################*/
      if (element?.type === "RestElement") {
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
          ...getPropsOptimizations(
            element,
            derivedFnName,
            last + `[${i}].`,
            vars,
          ),
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
    const name =
      value?.left?.name ??
      value?.name ??
      prop?.key?.name ??
      `["${value?.value ?? prop?.key?.value}"]`;

    const defaultValue = getDefaultValue(right);
    const dotValueForDefault = defaultValue.isIdentifier ? DOT_VALUE_TEXT : "";
    const propDefaultText = defaultValue.fallbackText + dotValueForDefault;
    const dotValue = acc ? "" : DOT_VALUE_TEXT;
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
      result.push(...getPropsOptimizations(value, derivedFnName, newAcc, vars));
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
        const res = getDerivedArrowFnString(
          value.left?.name,
          addPrefix(newAcc + propDefaultText),
          derivedFnName,
        );

        result.push(res);
        continue;
      }

      newAcc = `(${newAcc + propDefaultText}).`;
      result.push(
        ...getPropsOptimizations(value.left, derivedFnName, newAcc, vars),
      );
      continue;
    }

    // Skip first level without default value
    if (!acc && !propDefaultText && (prop?.argument?.name ?? name)) {
      firstLevelVars.push(
        prop?.argument?.name ? `...${prop.argument.name}` : name,
      );
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
    if (prop?.type === "RestElement" && acc) {
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

    /* #############################################################
       ####### Transform Property from Object to an arrow fn #######
       #############################################################*/
    const res = getDerivedArrowFnString(
      name,
      addPrefix(acc + name + dotValue + propDefaultText),
      derivedFnName,
    );
    result.push(res);
  }

  if (acc) return result;

  /* ##################################################################
     #####     Sort and clean the result (end of recursion)      ######
     ##################################################################*/
  const sortedResult = result.toSorted(sortByPropDependencies());
  const difference = vars.dotValueList.difference(vars.propsList);

  if (sortedResult.length && firstLevelVars.length) {
    sortedResult.unshift(`const {${firstLevelVars.join(", ")}} = __b_props__;`);
  }

  if (!difference.size) return sortedResult;

  // Remove .value from external identifiers default values
  return sortedResult.map((r) =>
    r.replace(
      new RegExp(
        `(${Array.from(difference).join("|")})\\${DOT_VALUE_TEXT}`,
        "g",
      ),
      "$1",
    ),
  );
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

function getDerivedArrowFnString(
  name: string,
  arrowContent: string,
  derivedFnName: string,
) {
  return `const ${name} = ${derivedFnName}(() => ${arrowContent});`;
}

function getDeps(code: string) {
  const matches = code
    .match(EXTRA_END_REGEX)?.[0]
    ?.match(PROP_DEPENDENCY_REGEX);
  return new Set(
    matches?.filter(Boolean)?.map((d) => d.replace(DOT_VALUE_TEXT, "")),
  );
}

function sortByPropDependencies() {
  let depsSet = new Set<string>();

  return (a: string, b: string) => {
    const aDeps = getDeps(a);
    const bDeps = getDeps(b);
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
