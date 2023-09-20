import isTranslationMatchingPathname from "../is-translation-matching-pathname";

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
      const { page, locale } = translations[translation];

      if (locale !== userLocale) continue;

      const hasLocale = userLocale && pages[page][userLocale];
      const translationIsDifferentFromPage = translation !== page;

      if (
        hasLocale &&
        translationIsDifferentFromPage &&
        isTranslationMatchingPathname(page, url.pathname)
      ) {
        return { route: null, isReservedPathname: false };
      }

      if (isTranslationMatchingPathname(translation, url.pathname)) {
        url.pathname = page;
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
    { locale, page: path },
  ]);
}
