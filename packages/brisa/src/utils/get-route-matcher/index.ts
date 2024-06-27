import type { MatchedRoute } from "bun";
import type { RequestContext, RouterType } from "@/types";
import isTestFile from "@/utils/is-test-file";
import { getEntrypointsRouter } from "@/utils/get-entrypoints";

export default function getRouteMatcher(
  dir: string,
  reservedPathnames: string[] = [],
  locale?: string,
): RouterType {
  const router = getEntrypointsRouter(dir);
  const reservedPathnamesSet = new Set(reservedPathnames);
  const routeMatcher = (req: RequestContext) => {
    const url = new URL(req.finalURL);

    if (locale) {
      url.pathname = url.pathname.replace(new RegExp(`/${locale}(/|$)`), "");
    }

    const route = router.match(url.toString());

    if (
      isTestFile(route?.name) ||
      url.pathname.endsWith("/index") ||
      url.pathname.endsWith("\\index")
    ) {
      return { route: null, isReservedPathname: false };
    }

    return {
      route,
      isReservedPathname: reservedPathnamesSet.has(route?.pathname ?? ""),
    };
  };

  const reservedRoutes = reservedPathnames.reduce(
    (all, pathname) => {
      all[pathname] = router.match(pathname);
      return all;
    },
    {} as Record<string, MatchedRoute | null>,
  );

  return { match: routeMatcher, reservedRoutes };
}
