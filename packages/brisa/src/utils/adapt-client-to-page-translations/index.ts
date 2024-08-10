/**
 * This code is WITHOUT Bun.FileSystemRouter to be used on client side.
 *
 * @param pages - The pages to be used during the translations,
 *     ex:
 *  {
 *     '/about': {
 *       en: '/about',
 *       pt: '/sobre'
 *     },
 *    '/contact': {
 *      en: '/contact',
 *      pt: '/contato'
 *    },
 *    '/user/[id]': {
 *     en: '/user/[id]',
 *     pt: '/usuario/[id]'
 *   }
 * @param pathname - The pathname to be matched,
 *    ex: '/about', '/contact', '/user/john'
 * @param lang - The language to be used, ex: 'en', 'pt'
 * @returns The translations, ex: /usuario/john
 */
export default function adaptClientToPageTranslations(
  pages: Record<string, Record<string, string>>,
  pathname: string,
  lang: string,
) {
  for (const [route, translations] of Object.entries(pages)) {
    const splittedRoute = route.split('/');
    const isCatchAllOrRest = splittedRoute.at(-1)?.includes('[...');
    const dynamicSlices = new Set<number>();
    const routeLength = splittedRoute.length;
    const lastIndex = routeLength - 1;
    const splittedPathname = pathname.split('/');
    const pathnameLength = splittedPathname.length;

    for (let i = 0; i < routeLength; i++) {
      if (splittedRoute[i].startsWith('[')) dynamicSlices.add(i);
    }

    const pathnameGroups = Object.groupBy(splittedPathname, (_, index) =>
      dynamicSlices.has(index) ||
      (!(isCatchAllOrRest && index < lastIndex) && isCatchAllOrRest)
        ? 'r'
        : 'k',
    );

    function getTranslationWithDynamicParts() {
      const langTranslation = translations[lang] ?? route;
      const dynamicParts = pathnameGroups.r ?? [];
      const trans = langTranslation
        .split('/')
        .map((part, index) =>
          dynamicSlices.has(index) ? dynamicParts.shift() : part,
        )
        .join('/');

      return isCatchAllOrRest && pathnameLength > routeLength
        ? `${trans}/${splittedPathname.slice(routeLength, pathnameLength).join('/')}`
        : trans;
    }

    const newPathname = (pathnameGroups.k ?? []).join('/');
    const newRoute = splittedRoute
      .filter((_, index) => !dynamicSlices.has(index))
      .join('/');

    if (newPathname === newRoute) {
      return getTranslationWithDynamicParts();
    }

    for (const translation of Object.values(translations)) {
      const newTranslation = translation
        .split('/')
        .filter((_, index) => !dynamicSlices.has(index))
        .join('/');

      if (newPathname === newTranslation) {
        return getTranslationWithDynamicParts();
      }
    }
  }

  return null;
}
