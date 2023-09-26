import { RequestContext } from "../../brisa";
import getConstants from "../../constants";
import { I18nConfig, Props, Translations } from "../../types";
import routeMatchPathname from "../route-match-pathname";
import substituteI18nRouteValues from "../substitute-i18n-route-values";

export default function renderAttributes({
  props,
  request,
  type,
}: {
  props: Props;
  request: RequestContext;
  type: string;
}): string {
  const { IS_PRODUCTION, CONFIG } = getConstants();
  let attributes = "";

  for (const prop in props) {
    let value = props[prop];

    if (prop === "children" || (type === "html" && prop === "lang")) continue;

    // Add the assetPrefix to internal assets (img, picture, video, audio, script)
    if (
      IS_PRODUCTION &&
      prop === "src" &&
      CONFIG.assetPrefix &&
      !URL.canParse(value as string)
    ) {
      value = `${CONFIG.assetPrefix}${value}`;
    }

    // i18n navigation
    if (
      type === "a" &&
      prop === "href" &&
      request.i18n?.locale &&
      typeof value === "string"
    ) {
      attributes += ` ${prop}="${renderI18nHrefAttribute(value, request)}"`;
      continue;
    }

    attributes += ` ${prop}="${value}"`;
  }

  if (type === "html" && request.i18n?.locale) {
    attributes += ` lang="${request.i18n?.locale}"`;
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
