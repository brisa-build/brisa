import getConstants from "@/constants";
import { I18nConfig, Props, RequestContext, Translations } from "@/types";
import routeMatchPathname from "@/utils/route-match-pathname";
import { serialize } from "@/utils/serialization";
import stylePropsToString from "@/utils/style-props-to-string";
import substituteI18nRouteValues from "@/utils/substitute-i18n-route-values";

const PROPS_TO_IGNORE = new Set(["children", "__isWebComponent"]);

export default function renderAttributes({
  props,
  request,
  type,
}: {
  props: Props;
  request: RequestContext;
  type: string;
}): string {
  const { IS_PRODUCTION, CONFIG, BOOLEANS_IN_HTML } = getConstants();
  let attributes = "";

  for (const prop in props) {
    const key = prop.toLowerCase();
    let value = props[prop];

    if (PROPS_TO_IGNORE.has(prop) || (type === "html" && prop === "lang"))
      continue;

    // Add the assetPrefix to internal assets (img, picture, video, audio, script)
    if (
      IS_PRODUCTION &&
      prop === "src" &&
      CONFIG.assetPrefix &&
      !URL.canParse(value as string)
    ) {
      value = `${CONFIG.assetPrefix}${value}`;
    }

    // Skip undefined values
    if (typeof value === "undefined") continue;

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
    if (
      type === "a" &&
      prop === "href" &&
      request.i18n?.locale &&
      typeof value === "string"
    ) {
      attributes += ` ${key}="${renderI18nHrefAttribute(value, request)}"`;
      continue;
    }

    attributes += ` ${key}="${value}"`;
  }

  if (type === "html" && request.i18n?.locale) {
    attributes += ` lang="${request.i18n?.locale}"`;
    const { direction } = (
      new Intl.Locale(request.i18n?.locale) as any
    ).getTextInfo();
    attributes += ` dir="${direction}"`;
  }

  return attributes;
}

export function renderI18nHrefAttribute(
  pagePathname: string,
  request: RequestContext,
) {
  const { I18N_CONFIG, CONFIG } = getConstants();
  const { pages } = I18N_CONFIG ?? {};
  const { locale, locales } = request.i18n ?? {};
  const isExternalUrl = URL.canParse(pagePathname);
  const trailingSlashSymbol = CONFIG.trailingSlash ? "/" : "";
  let pathname = pagePathname.replace(/\/$/, "");

  if (isExternalUrl || !locale) return pagePathname;

  const page = findTranslatedPage(pages, pathname);

  if (page) {
    const [pageName, translations] = page;
    const translatedPage = (translations as Translations)?.[locale] ?? pageName;
    pathname = substituteI18nRouteValues(translatedPage, pathname);
  }

  if (!locales?.some((locale) => pathname?.split("/")?.[1] === locale)) {
    return `/${locale}${pathname}${trailingSlashSymbol}`;
  }

  return pathname;
}

function findTranslatedPage(pages: I18nConfig["pages"], pathname: string) {
  for (const page of Object.entries(pages ?? {})) {
    if (routeMatchPathname(page[0], pathname)) return page;
  }
}
