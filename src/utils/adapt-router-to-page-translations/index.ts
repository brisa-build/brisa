import extendRequestContext from "../extend-request-context";
import {
  I18nConfig,
  RequestContext,
  RouterType,
  Translations,
} from "../../types";
import routeMatchPathname from "../route-match-pathname";
import substituteI18nRouteValues from "../substitute-i18n-route-values";

const regexTrailingSlash = /\/$/;

export default function adaptRouterToPageTranslations(
  pages: I18nConfig["pages"],
  pagesRouter: RouterType
) {
  const pageEntries = Object.entries(pages ?? {});
  const translationsEntries = pageEntries.flatMap(toTranslationEntries);
  const translations = Object.fromEntries(translationsEntries);

  const match = (req: RequestContext) => {
    const url = new URL(req.finalURL);
    const userLocale = req.i18n?.locale;
    const newReq = (url: string) =>
      extendRequestContext({ originalRequest: req, finalURL: url });

    url.pathname = url.pathname
      .replace(`/${userLocale}`, "")
      .replace(regexTrailingSlash, "");

    for (const translation in translations) {
      const { route, locale } = translations[translation];

      if (locale !== userLocale) continue;

      const hasLocale = userLocale && pages?.[route][userLocale];
      const translationIsDifferentFromPage = translation !== route;

      if (
        hasLocale &&
        translationIsDifferentFromPage &&
        routeMatchPathname(route, url.pathname)
      ) {
        return { route: null, isReservedPathname: false };
      }

      if (routeMatchPathname(translation, url.pathname)) {
        url.pathname = substituteI18nRouteValues(route, url.pathname);
        return pagesRouter.match(newReq(url.toString()));
      }
    }

    return pagesRouter.match(newReq(url.toString()));
  };

  return { match, reservedRoutes: pagesRouter.reservedRoutes };
}

function toTranslationEntries([path, translations]: [string, Translations]) {
  return Object.entries(translations ?? {}).map(([locale, translation]) => [
    translation,
    { locale, route: path },
  ]);
}
