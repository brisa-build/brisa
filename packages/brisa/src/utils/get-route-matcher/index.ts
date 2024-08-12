import path from 'node:path';
import type { MatchedBrisaRoute, RequestContext, RouterType } from '@/types';
import isTestFile from '@/utils/is-test-file';
import { fileSystemRouter } from '@/utils/file-system-router';

export default function getRouteMatcher(
  dir: string,
  reservedPathnames: string[] = [],
  locale?: string,
): RouterType {
  const router = fileSystemRouter({ dir });
  const reservedPathnamesSet = new Set(reservedPathnames);
  const routeMatcher = (req: RequestContext) => {
    const url = new URL(req.finalURL);

    if (locale) {
      url.pathname = url.pathname.replace(new RegExp(`/${locale}(/|$)`), '');
    }

    let route = router.match(url.toString());

    if (isTestFile(route?.name) || url.pathname.endsWith(path.sep + 'index')) {
      return { route: null, isReservedPathname: false };
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
