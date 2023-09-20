import { RequestContext } from "../../bunrise";
import getConstants from "../../constants";
import { Props } from "../../types";
import routeMatchPathname from "../route-match-pathname";

export default function renderAttributes({
  props,
  request,
  type,
}: {
  props: Props;
  request: RequestContext;
  type: string;
}): string {
  let attributes = "";

  for (const prop in props) {
    const value = props[prop];

    if (prop === "children" || (type === "html" && prop === "lang")) continue;

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

function renderI18nHrefAttribute(value: string, request: RequestContext) {
  const { I18N_CONFIG } = getConstants();
  const { pages } = I18N_CONFIG ?? {};
  const { locale, locales } = request.i18n ?? {};
  const isExternalUrl = URL.canParse(value);
  let pathname = value;

  if (isExternalUrl || !locale) return value;

  const page = Object.entries(pages ?? {}).find(([pageName]) =>
    routeMatchPathname(pageName, pathname),
  );

  if (page) {
    const [pageName, translations] = page;
    const translatedPage = translations?.[locale] ?? pageName;
    pathname = substituteI18nRouteValues(translatedPage, pathname);
  }

  if (!locales?.some((locale) => pathname?.split("/")?.[1] === locale)) {
    return `/${locale}${pathname === "/" ? "" : pathname}`;
  }

  return pathname;
}

/**
 * 
 * @description Transforms:
 * - route: /usuario/[username]/configuracion 
 * - pathname: /user/john/settings
 * 
 * into:
 * - /usuario/john/configuracion
 */
export function substituteI18nRouteValues(route: string, pathname: string) {
  const { REGEX } = getConstants();

  if (!route.match(REGEX.DYNAMIC)?.length) return route;

  const pathnameParts = pathname.split("/");
  const routeParts = route.split("/");

  const routePartsReplaced = routeParts.map((routePart, index) => {
    const isCatchAllRoute = REGEX.CATCH_ALL.test(routePart);
    const isRestRoute = REGEX.REST_DYNAMIC.test(routePart);
    const isDynamicRoute = REGEX.DYNAMIC.test(routePart);

    if (!isCatchAllRoute && !isRestRoute && !isDynamicRoute) return routePart;

    const pathnamePart = pathnameParts[index];

    if (!pathnamePart) return routePart;

    if (isCatchAllRoute || isRestRoute) {
      return pathnameParts.slice(index).join("/");
    }

    return pathnamePart;
  });

  return routePartsReplaced.join("/");
}
