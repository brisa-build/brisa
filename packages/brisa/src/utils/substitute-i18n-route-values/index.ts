import constants from "@/constants";

const { REGEX } = constants;

/**
 *
 * @description Transforms:
 * - route: /usuario/[username]/configuracion?foo=bar#baz
 * - href: /user/john/settings?foo=bar#baz
 *
 * into:
 * - /usuario/john/configuracion
 */
export default function substituteI18nRouteValues(route: string, href: string) {
  const url = new URL(href, "http://localhost");
  const paramsAndHash = url.search + url.hash;

  if (!route.match(REGEX.DYNAMIC)?.length) return route + paramsAndHash;

  const pathnameParts = url.pathname.split("/");
  const routeParts = route.split("/");

  const routePartsReplaced = routeParts.map((routePart, index) => {
    const isCatchAllRoute = REGEX.CATCH_ALL.test(routePart);
    const isRestRoute = REGEX.REST_DYNAMIC.test(routePart);
    const isDynamicRoute = REGEX.DYNAMIC.test(routePart);

    if (!isCatchAllRoute && !isRestRoute && !isDynamicRoute) return routePart;

    const pathnamePart = pathnameParts[index];

    if (!pathnamePart) return routePart;

    if (isCatchAllRoute || isRestRoute) {
      return pathnameParts.slice(index).join("/");
    }

    return pathnamePart;
  });

  return routePartsReplaced.join("/") + paramsAndHash;
}
