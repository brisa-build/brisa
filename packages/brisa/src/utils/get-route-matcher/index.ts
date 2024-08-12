import path from 'node:path';
import type { MatchedBrisaRoute, RequestContext, RouterType } from '@/types';
import isTestFile from '@/utils/is-test-file';
import { fileSystemRouter } from '@/utils/file-system-router';

export default function getRouteMatcher(
  dir: string,
  reservedPathnames: string[] = [],
  locale?: string,
  separator = path.sep,
): RouterType {
  const router = fileSystemRouter({ dir });
  const isDifferentSeparator = separator !== '/';
  const reservedPathnamesSet = new Set(reservedPathnames);
  const routeMatcher = (req: RequestContext) => {
    const url = new URL(req.finalURL);

    if (locale) {
      url.pathname = url.pathname.replace(new RegExp(`/${locale}(/|$)`), '');
    }

    let route = router.match(url.toString());

    if (isTestFile(route?.name) || url.pathname.endsWith(separator + 'index')) {
      return { route: null, isReservedPathname: false };
    }

    // Fix in Windows to use the correct path separator inside the filePath
    if (isDifferentSeparator && route?.filePath) {
      route = {
        filePath: route.filePath.replaceAll('/', separator),
        kind: route.kind,
        name: route.name,
        params: route.params,
        pathname: route.pathname,
        query: route.query,
      };
    }

    return {
      route,
      isReservedPathname: reservedPathnamesSet.has(route?.pathname ?? ''),
    };
  };

  const reservedRoutes = reservedPathnames.reduce(
    (all, pathname) => {
      all[pathname] = router.match(pathname);
      return all;
    },
    {} as Record<string, MatchedBrisaRoute | null>,
  );

  return { match: routeMatcher, reservedRoutes };
}
