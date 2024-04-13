import { getConstants } from "@/constants";
import type {
  I18nConfig,
  IndicatorSignal,
  Props,
  RequestContext,
  Translations,
} from "@/types";
import routeMatchPathname from "@/utils/route-match-pathname";
import { serialize } from "@/utils/serialization";
import stylePropsToString from "@/utils/style-props-to-string";
import substituteI18nRouteValues from "@/utils/substitute-i18n-route-values";
import isAnAction from "@/utils/is-an-action";
import { addBasePathToStringURL } from "@/utils/base-path";

const PROPS_TO_IGNORE = new Set(["children", "__isWebComponent"]);
const VALUES_TYPE_TO_IGNORE = new Set(["function", "undefined"]);

export default function renderAttributes({
  elementProps,
  request,
  type,
  componentProps,
}: {
  elementProps: Props;
  request: RequestContext;
  type: string;
  componentProps?: Props;
}): string {
  const { IS_PRODUCTION, CONFIG, BOOLEANS_IN_HTML } = getConstants();
  const { basePath, assetPrefix } = CONFIG;
  const useAssetPrefix = assetPrefix && IS_PRODUCTION;
  const keys = new Set<string>();
  let attributes = "";
  let submitAction = elementProps["data-action-onsubmit"];

  for (const prop in elementProps) {
    const key = prop.toLowerCase();
    let value = elementProps[prop];

    if (keys.has(key)) continue;

    // Add the key to the set to avoid duplicates
    keys.add(key);

    if (PROPS_TO_IGNORE.has(prop) || (type === "html" && prop === "lang"))
      continue;

    // Add the basePath or assetPrefix to internal assets (img, picture, video, audio, script)
    if (
      prop === "src" &&
      (useAssetPrefix || basePath) &&
      !URL.canParse(value as string)
    ) {
      value = `${useAssetPrefix ? assetPrefix : basePath}${value}`;
    }

    // Nested actions (coming from props)
    if (isAnAction(value)) {
      const actionKey = `data-action`;
      const actionToEventKey = `${actionKey}-${key}`;
      const modifiedAttributes = attributes.replace(
        new RegExp(`${actionToEventKey}=".*?"`),
        `${actionToEventKey}="${value.actionId}"`,
      );

      if (key === "onsubmit") {
        submitAction = value.actionId;
      }

      if (keys.has(actionToEventKey)) {
        attributes = modifiedAttributes;
      } else {
        keys.add(actionToEventKey);
        attributes += ` ${actionToEventKey}="${value.actionId}"`;
      }

      if (!keys.has(actionKey)) {
        keys.add(actionKey);
        attributes += ` ${actionKey}`;
      }

      continue;
    }

    // Simplify indicator signals
    if (key === "indicator") {
      const arr = Array.isArray(value) ? value : [value];
      value = serialize(arr.map((a) => a.id));
    }
    // `indicate` attribute
    if (
      key.startsWith("indicate") &&
      (value as IndicatorSignal)?.id?.startsWith("__ind:")
    ) {
      value = (value as IndicatorSignal).id;
    }

    // Skip types that are not supported in HTML
    if (VALUES_TYPE_TO_IGNORE.has(typeof value)) continue;

    // Example <dialog open> => <dialog>
    if (typeof value === "boolean" && BOOLEANS_IN_HTML.has(key)) {
      if (value) attributes += ` ${key}`;
      continue;
    }

    // Example data-test={ bar: "foo" } => <div data-test="{'bar':'foo'}">
    if (typeof value === "object") {
      attributes += ` ${key}="${
        value && key === "style" ? stylePropsToString(value) : serialize(value)
      }"`;
      continue;
    }

    // i18n navigation
    if (type === "a" && prop === "href" && typeof value === "string") {
      attributes += ` ${key}="${renderHrefAttribute(value, request)}"`;
      continue;
    }

    attributes += ` ${key}="${value}"`;
  }

  // Add external action ids into data-actions attribute.
  //
  // This allows an action to call other actions without having to transfer
  // anything. It is exposed in the client (HTML) the id of the actions that
  // could call the current action, this way when the action is loaded the
  // props are passed with the other actions.
  //
  // For security, we prefer not to expose other props or server variables
  // in the HTML. To support this it is necessary for developers to have
  // control over which variables they want to transfer, and to encrypt/decrypt
  // the most sensitive ones or find an alternative such as asking for the
  // values back in the database. Unlike current frameworks that use Server
  // Actions we don't want to do this kind of magic out of the developer's
  // control, because encrypting/decrypting props slows down requests and
  // exposes code without the developer's will.
  if (componentProps && keys.has("data-action")) {
    const entries = [];
    let dependencies = [];

    for (const [key, value] of Object.entries(componentProps)) {
      if (isAnAction(value)) {
        entries.push([key, value.actionId]);

        if (dependencies.length === 0 && value.actions?.length) {
          dependencies = value.actions.slice() as any[];
        }
      }
    }

    const hasEntries = entries.length > 0;
    const hasDeps = hasEntries || dependencies.length > 0;

    if (hasEntries) dependencies.unshift(entries);
    if (hasDeps) attributes += ` data-actions="${serialize(dependencies)}"`;
  }

  // Form action - Add "action" and "method" if not present
  if (submitAction && type === "form") {
    if (!keys.has("action")) {
      const url = new URL(request.url);

      url.searchParams.set("_aid", submitAction as string);
      keys.add("action");
      attributes += ` action="${url.pathname}${url.search}"`;
    }

    if (!keys.has("enctype")) {
      keys.add("enctype");
      attributes += ` enctype="multipart/form-data"`;
    }

    if (!keys.has("method")) {
      keys.add("method");
      attributes += ` method="POST"`;
    }
  }

  if (type === "html" && request.i18n?.locale) {
    attributes += ` lang="${request.i18n?.locale}"`;
    const { direction } = (
      new Intl.Locale(request.i18n?.locale) as any
    ).getTextInfo();
    attributes += ` dir="${direction}"`;
  }

  if (type === "head" && basePath) {
    attributes += ` basepath="${basePath}"`;
  }

  return attributes;
}

export function renderHrefAttribute(
  hrefValue: string,
  request: RequestContext,
) {
  const { I18N_CONFIG } = getConstants();
  const { pages } = I18N_CONFIG ?? {};
  const { locale, locales } = request.i18n ?? {};
  const isExternalUrl = URL.canParse(hrefValue);
  let formattedHref = hrefValue.replace(/\/$/, "");

  for (const [key, value] of Object.entries(request.route?.params ?? {})) {
    formattedHref = formattedHref.replace(`[${key}]`, value);
  }

  if (isExternalUrl) return hrefValue;
  if (!locale) return addBasePathToStringURL(hrefValue);

  const page = findTranslatedPage(pages, formattedHref);

  if (page) {
    const [pageName, translations] = page;
    const translatedPage = (translations as Translations)?.[locale] ?? pageName;
    formattedHref = substituteI18nRouteValues(translatedPage, formattedHref);
  }

  const useI18n = !locales?.some(
    (locale) => formattedHref?.split("/")?.[1] === locale,
  );
  const fixedUrl = manageTrailingSlash(
    useI18n ? `/${locale}${formattedHref}` : formattedHref,
  );

  return addBasePathToStringURL(fixedUrl);
}

function findTranslatedPage(pages: I18nConfig["pages"], pathname: string) {
  for (const page of Object.entries(pages ?? {})) {
    if (routeMatchPathname(page[0], pathname)) return page;
  }
}

function manageTrailingSlash(urlString: string) {
  const { CONFIG } = getConstants();

  if (!CONFIG.trailingSlash) return urlString;

  const fakeOrigin = "http://localhost";
  const url = new URL(urlString, fakeOrigin);

  url.pathname = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;

  return url.toString().replace(fakeOrigin, "");
}
