export default function adaptRouterToPageTranslations(pages, pagesRouter) {
  const pageEntries = Object.entries(pages);
  const translationsEntries = pageEntries.flatMap(toTranslationEntries);
  const translations = Object.fromEntries(translationsEntries);

  const match = (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const userLocale = req.i18n?.locale;
    let request = req;

    for (const translation in translations) {
      const { page, locale } = translations[translation];

      if (locale !== userLocale) continue;

      const hasLocale = userLocale && pages[page][userLocale];
      const translationIsDifferentFromPage = translation !== page;

      if (hasLocale && translationIsDifferentFromPage && compare(page, pathname)) {
        return { route: null, isReservedPathname: false };
      }

      if (compare(translation, pathname)) {
        url.pathname = page;
        return pagesRouter.match(new Request(url.toString(), req));
      }
    }

    return pagesRouter.match(request);
  };

  return { match, reservedRoutes: pagesRouter.reservedRoutes };
}

function compare(translation, pathname) {
  // [username] -> [\w+]
  const dynamicPart = translation.replace(/\[.*?\]/g, "\\w+");
  // [...rest] -> [.*]
  const restDynamicPart = translation.replace(/\[\.{3}.*?\]/g, ".*");
  // [[..catchall]] -> [.*]
  const catchAllDynamicPart = translation.replace(/\[\[\.{3}.*?\]\]/g, ".*");

  return (
    new RegExp(`^${catchAllDynamicPart}$`).test(pathname) ||
    new RegExp(`^${restDynamicPart}$`).test(pathname) ||
    new RegExp(`^${dynamicPart}$`).test(pathname)
  );
}

function toTranslationEntries([path, translations]) {
  return Object.entries(translations ?? {}).map(([locale, translation]) => [
    translation,
    { locale, page: path },
  ]);
}
