import { getConstants } from '@/constants';
import type { getEntrypointsRouter } from '@/utils/get-entrypoints';

const DYNAMIC_ROUTE_REGEX = /\[{1,2}\.*[^\[\]]+\]{1,2}/g;
const DYNAMIC_SLUG = 'abc-123';
const ROUTES_TO_IGNORE = new Set(['/_500', '/_404']);

export default function generateDynamicTypes({
  allWebComponents,
  pagesRoutes,
}: {
  allWebComponents: Record<string, string>;
  pagesRoutes: ReturnType<typeof getEntrypointsRouter>;
}) {
  const { CONFIG } = getConstants();
  const intrinsicCustomElements = `export interface IntrinsicCustomElements {
    ${Object.entries(allWebComponents)
      .map(
        ([name, location]) =>
          `'${name}': JSX.WebComponentAttributes<typeof import("${location}").default>;`,
      )
      .join('\n')}
  }`;

  let routes = '';
  const keysLength = pagesRoutes.routes.length;

  for (let i = 0; i < keysLength; i++) {
    const route = pagesRoutes.routes[i][0];

    if (ROUTES_TO_IGNORE.has(route)) continue;

    let normalizedRoute = route.replace(DYNAMIC_ROUTE_REGEX, DYNAMIC_SLUG);

    if (CONFIG.trailingSlash && !normalizedRoute.endsWith('/')) {
      normalizedRoute += '/';
    }

    const separator = i > 0 ? ' | ' : '';
    routes += `${separator}"${normalizedRoute}"`;
  }

  const pageRouteType = routes.length
    ? `export type PageRoute = ${routes};`
    : '';

  return intrinsicCustomElements + '\n' + pageRouteType;
}
