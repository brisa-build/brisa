const join = (arr: any = []) => arr.join('/');
const split = (str: string) => str.split('/');

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
  const url = new URL(pathname, 'http://l');
  const splittedPathname = split(url.pathname);

  for (const [route, translations] of Object.entries(pages)) {
    const splittedRoute = split(route);
    const isCatchAllOrRest = splittedRoute.at(-1)?.includes('[...');
    const dynamicSlices = new Set<number>();
    const routeLength = splittedRoute.length;
    const lastIndex = routeLength - 1;

    for (let i = 0; i < routeLength; i++) {
      if (splittedRoute[i].startsWith('[')) dynamicSlices.add(i);
    }

    const pathnameGroups = Object.groupBy(splittedPathname, (_, index) =>
      dynamicSlices.has(index) ||
      (!(isCatchAllOrRest && index < lastIndex) && isCatchAllOrRest)
        ? 'r'
        : 'k',
    );

    const removeDynamicSlides = (_: unknown, index: number) =>
      !dynamicSlices.has(index);

    function getTranslationWithDynamicParts() {
      const langTranslation = translations[lang] ?? route;
      const dynamicParts = pathnameGroups.r ?? [];
      const trans = join(
        split(langTranslation).map((part, index) =>
          dynamicSlices.has(index) ? dynamicParts.shift() : part,
        ),
      );

      return (
        (isCatchAllOrRest && splittedPathname.length > routeLength
          ? `${trans}/${join(splittedPathname.slice(routeLength))}`
          : trans) +
        url.search +
        url.hash
      );
    }

    const newPathname = join(pathnameGroups.k);
    const newRoute = join(splittedRoute.filter(removeDynamicSlides));

    if (newPathname === newRoute) {
      return getTranslationWithDynamicParts();
    }

    if (
      Object.values(translations).some(
        (tr) => join(split(tr).filter(removeDynamicSlides)) === newPathname,
      )
    ) {
      return getTranslationWithDynamicParts();
    }
  }
}
