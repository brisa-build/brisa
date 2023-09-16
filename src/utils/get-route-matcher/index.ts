import { MatchedRoute } from "bun";

export default function getRouteMatcher(
  dir: string,
  reservedPathnames: string[] = [],
  locale?: string,
) {
  const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir,
  });
  const reservedPathnamesSet = new Set(reservedPathnames);
  const routeMatcher = (req: Request) => {
    const url = new URL(req.url);

    if (locale) {
      url.pathname = url.pathname.replace(`/${locale}`, "");
    }

    const route = router.match(new Request(url, req));

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
