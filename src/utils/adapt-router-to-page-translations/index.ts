import routeMatchPathname from "../route-match-pathname";

const regexTrailingSlash = /\/$/;

export default function adaptRouterToPageTranslations(pages, pagesRouter) {
  const pageEntries = Object.entries(pages);
  const translationsEntries = pageEntries.flatMap(toTranslationEntries);
  const translations = Object.fromEntries(translationsEntries);

  const match = (req) => {
    const url = new URL(req.url);
    const userLocale = req.i18n?.locale;

    url.pathname = url.pathname
      .replace(`/${userLocale}`, "")
      .replace(regexTrailingSlash, "");

    for (const translation in translations) {
      const { route, locale } = translations[translation];

      if (locale !== userLocale) continue;

      const hasLocale = userLocale && pages[route][userLocale];
      const translationIsDifferentFromPage = translation !== route;

      if (
        hasLocale &&
        translationIsDifferentFromPage &&
        routeMatchPathname(route, url.pathname)
      ) {
        return { route: null, isReservedPathname: false };
      }

      if (routeMatchPathname(translation, url.pathname)) {
        url.pathname = route;
        return pagesRouter.match(new Request(url.toString(), req));
      }
    }

    return pagesRouter.match(new Request(url.toString(), req));
  };

  return { match, reservedRoutes: pagesRouter.reservedRoutes };
}

function toTranslationEntries([path, translations]) {
  return Object.entries(translations ?? {}).map(([locale, translation]) => [
    translation,
    { locale, route: path },
  ]);
}
