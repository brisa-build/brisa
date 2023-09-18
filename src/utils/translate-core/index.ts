import getConstants from "../../constants";
import {
  I18nConfig,
  I18nDictionary,
  Translate,
  TranslationQuery,
} from "../../types";
import formatElements from "./format-elements";

export default function translateCore(locale: string) {
  const config: I18nConfig = getConstants().I18N_CONFIG || {};
  const { allowEmptyStrings = true } = config;
  const pluralRules = new Intl.PluralRules(locale);
  const interpolateUnknown = (value, query): typeof value => {
    if (Array.isArray(value)) {
      return value.map((val) => interpolateUnknown(val, query));
    }
    if (value instanceof Object) {
      return objectInterpolation({
        obj: value as Record<string, unknown>,
        query,
        config,
        locale,
      });
    }
    return interpolation({ text: value as string, query, config, locale });
  };

  const translate: Translate = (i18nKey = "", query, options) => {
    const dic = config.messages?.[locale] || {};
    const keyWithPlural = plural(
      pluralRules,
      dic,
      i18nKey as string,
      config,
      query,
    );
    const dicValue = getDicValue(dic, keyWithPlural, config, options);
    const value =
      typeof dicValue === "object"
        ? JSON.parse(JSON.stringify(dicValue))
        : dicValue;

    const empty =
      typeof value === "undefined" ||
      (typeof value === "object" && !Object.keys(value).length) ||
      (value === "" && !allowEmptyStrings);

    const fallbacks =
      typeof options?.fallback === "string"
        ? [options.fallback]
        : options?.fallback || [];

    // Fallbacks
    if (empty && Array.isArray(fallbacks) && fallbacks.length) {
      const [firstFallback, ...restFallbacks] = fallbacks;
      if (typeof firstFallback === "string") {
        return t(firstFallback, query, { ...options, fallback: restFallbacks });
      }
    }

    if (
      empty &&
      options &&
      // options.default could be a nullish value so check that the property exists
      options.hasOwnProperty("default") &&
      !fallbacks?.length
    ) {
      // if options.default is falsey there's no reason to do interpolation
      return options.default
        ? interpolateUnknown(options.default, query)
        : options.default;
    }

    // no need to try interpolation
    if (empty) return i18nKey;

    // this can return an empty string if either value was already empty
    // or it contained only an interpolation (e.g. "{{name}}") and the query param was empty
    return interpolateUnknown(value, query);
  };

  const t = (i18nKey, query, options) => {
    const translationText = translate(i18nKey, query, options);
    return options?.elements
      ? formatElements(translationText, options.elements)
      : translationText;
  };

  return t;
}

/**
 * Get value from key (allow nested keys as parent.children)
 */
function getDicValue(
  dic: I18nDictionary,
  key: string = "",
  config: I18nConfig,
  options: { returnObjects?: boolean; fallback?: string | string[] } = {
    returnObjects: false,
  },
): unknown | undefined {
  const { keySeparator = "." } = config || {};
  const keyParts = keySeparator ? key.split(keySeparator) : [key];

  if (key === keySeparator && options.returnObjects) return dic;

  const value: string | object = keyParts.reduce(
    (val: I18nDictionary | string, key: string) => {
      if (typeof val === "string") return {};

      const res = val[key as keyof typeof val];

      // pass all truthy values or (empty) strings
      return res || (typeof res === "string" ? res : {});
    },
    dic,
  );

  if (
    typeof value === "string" ||
    ((value as unknown) instanceof Object && options.returnObjects)
  ) {
    return value;
  }

  return undefined;
}

/**
 * Control plural keys depending the {{count}} variable
 */
function plural(
  pluralRules: Intl.PluralRules,
  dic: I18nDictionary,
  key: string,
  config: I18nConfig,
  query?: TranslationQuery | null,
): string {
  if (!query || typeof query.count !== "number") return key;

  const numKey = `${key}_${query.count}`;
  if (getDicValue(dic, numKey, config) !== undefined) return numKey;

  const pluralKey = `${key}_${pluralRules.select(query.count)}`;
  if (getDicValue(dic, pluralKey, config) !== undefined) {
    return pluralKey;
  }

  const nestedNumKey = `${key}.${query.count}`;
  if (getDicValue(dic, nestedNumKey, config) !== undefined) return nestedNumKey;

  const nestedKey = `${key}.${pluralRules.select(query.count)}`;
  if (getDicValue(dic, nestedKey, config) !== undefined) return nestedKey;

  return key;
}

/**
 * Replace {{variables}} to query values
 */
function interpolation({
  text,
  query,
  config,
  locale,
}: {
  text?: string;
  query?: TranslationQuery | null;
  config: I18nConfig;
  locale: string;
}): string {
  if (!text || !query) return text || "";

  const escapeRegex = (str: string) =>
    str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const {
    format = null,
    prefix = "{{",
    suffix = "}}",
  } = config.interpolation || {};

  const regexEnd =
    suffix === "" ? "" : `(?:[\\s,]+([\\w-]*))?\\s*${escapeRegex(suffix)}`;
  return Object.keys(query).reduce((all, varKey) => {
    const regex = new RegExp(
      `${escapeRegex(prefix)}\\s*${varKey}${regexEnd}`,
      "gm",
    );
    // $1 is the first match group
    return all.replace(regex, (_match, $1) => {
      // $1 undefined can mean either no formatting requested: "{{name}}"
      // or no format name given: "{{name, }}" -> ignore
      return $1 && format
        ? (format(query[varKey], $1, locale) as string)
        : (query[varKey] as string);
    });
  }, text);
}

function objectInterpolation({
  obj,
  query,
  config,
  locale,
}: {
  obj: Record<string, string | unknown>;
  query?: TranslationQuery | null;
  config: I18nConfig;
  locale: string;
}): any {
  if (!query || Object.keys(query).length === 0) return obj;
  Object.keys(obj).forEach((key) => {
    if (obj[key] instanceof Object)
      objectInterpolation({
        obj: obj[key] as Record<string, string | unknown>,
        query,
        config,
        locale,
      });
    if (typeof obj[key] === "string")
      obj[key] = interpolation({
        text: obj[key] as string,
        query,
        config,
        locale,
      });
  });

  return obj;
}
