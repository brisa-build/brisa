import type { MatchedRoute } from "bun";
import type { RequestContext, RouterType } from "@/types";

export default function getRouteMatcher(
  dir: string,
  reservedPathnames: string[] = [],
  locale?: string,
): RouterType {
  const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir,
  });
  const reservedPathnamesSet = new Set(reservedPathnames);
  const routeMatcher = (req: RequestContext) => {
    const url = new URL(req.finalURL);

    if (locale) {
      url.pathname = url.pathname.replace(`/${locale}`, "");
    }

    const route = router.match(url.toString());

    if (
      route?.name?.endsWith(".test") ||
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
