const catchAllRegexInput = /\[\[\.{3}.*?\]\]/g;
const restRegexInput = /\[\.{3}.*?\]/g;
const dynamicRouteRegexInput = /\[.*?\]/g;
const dynamicRouteStringOutput = '[^\\/:*?"<>|]+';
const everyCharacter = ".*";

export default function isTranslationMatchingPathname(
  translation: string,
  pathname: string,
) {
  const translationWithoutDynamicParts = translation
    .replace(catchAllRegexInput, everyCharacter) // [[...catchall]] -> [.*]
    .replace(restRegexInput, everyCharacter) // [...rest] -> [.*]
    .replace(dynamicRouteRegexInput, dynamicRouteStringOutput); // [dynamic] -> all characters except /:*?"<>|

  return new RegExp(`^${translationWithoutDynamicParts}$`).test(pathname);
}
