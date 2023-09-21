import { RequestContext } from "../../bunrise";
import getConstants from "../../constants";
import { I18nConfig, Translations } from "../../types";
import routeMatchPathname from "../route-match-pathname";

export default function translatePathname(pagePathname: string, request: RequestContext) {
  const { I18N_CONFIG } = getConstants();
  const { pages } = I18N_CONFIG ?? {};
  const { locale, locales } = request.i18n ?? {};
  const isExternalUrl = URL.canParse(pagePathname);
  let pathname = pagePathname;

  if (isExternalUrl || !locale) return pagePathname;

  const page = findTranslatedPage(pages, pathname);

  if (page) {
    const [pageName, translations] = page;
    const translatedPage = (translations as Translations)?.[locale] ?? pageName;
    pathname = substituteI18nRouteValues(translatedPage, pathname);
  }

  if (!locales?.some((locale) => pathname?.split("/")?.[1] === locale)) {
    return `/${locale}${pathname === "/" ? "" : pathname}`;
  }

  return pathname;
}

function findTranslatedPage(pages: I18nConfig['pages'], pathname: string) {
  if (!pages) return;

  return Object.entries(pages).find(([pageName]) =>
    routeMatchPathname(pageName, pathname)
  );
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
