import { getConstants } from "../../constants";

export default function routeMatchPathname(route: string, pathname: string) {
  const { REGEX } = getConstants();
  const everyCharacter = ".*";
  const routeWithoutDynamicParts = route
    .replace(REGEX.CATCH_ALL, everyCharacter) // [[...catchall]] -> [.*]
    .replace(REGEX.REST_DYNAMIC, everyCharacter) // [...rest] -> [.*]
    .replace(REGEX.DYNAMIC, '[^\\/:*?"<>|]+'); // [dynamic] -> all characters except /:*?"<>|

  return new RegExp(`^${routeWithoutDynamicParts}$`).test(pathname);
}
