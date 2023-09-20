const catchAllRegexInput = /\[\[\.{3}.*?\]\]/g;
const restRegexInput = /\[\.{3}.*?\]/g;
const dynamicRouteRegexInput = /\[.*?\]/g;
const dynamicRouteStringOutput = '[^\\/:*?"<>|]+';
const everyCharacter = ".*";

export default function routeMatchPathname(
  route: string,
  pathname: string,
) {
  const routeWithoutDynamicParts = route
    .replace(catchAllRegexInput, everyCharacter) // [[...catchall]] -> [.*]
    .replace(restRegexInput, everyCharacter) // [...rest] -> [.*]
    .replace(dynamicRouteRegexInput, dynamicRouteStringOutput); // [dynamic] -> all characters except /:*?"<>|

  return new RegExp(`^${routeWithoutDynamicParts}$`).test(pathname);
}
