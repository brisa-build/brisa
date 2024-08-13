import path from 'node:path';
import fs from 'node:fs';
import type { MatchedBrisaRoute } from '@/types';
import type { FileSystemRouterOptions } from '@/types/server';

const ENDS_WITH_SLASH_INDEX_REGEX = new RegExp(`${path.sep}index$`);
const DEFAULT_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.mjs', '.cjs', '.js'];
const MULTI_SLASH_REGEX = /(?<!:)\/{2,}/g;
const TRAILING_SLASH_REGEX = /\/$/;
const EXTRACT_PARAM_KEY_REGEX = /\[|\]|\./g;

// Inspired on Bun.FileSystemRouter, but compatible with Node.js as well
export function fileSystemRouter(options: FileSystemRouterOptions) {
  const routes = resolveRoutes(options);

  function match(routeToMatch: string): MatchedBrisaRoute | null {
    const url = new URL(
      routeToMatch.replace(MULTI_SLASH_REGEX, '/'),
      'http://l',
    );
    const pathname = decodeURIComponent(url.pathname + url.search + url.hash);
    const fixedPathname = decodeURIComponent(
      url.pathname.replace(TRAILING_SLASH_REGEX, '') || '/',
    ).trim();

    for (const [name, filePath] of Object.entries(routes)) {
      const kind = getRouteKind(name);
      const src = filePath.replace(options.dir + path.sep, '');

      if (kind === 'exact' && name === fixedPathname) {
        return {
          filePath,
          kind,
          name,
          pathname,
          src,
          ...getParamsAndQuery(name, fixedPathname, url),
        };
      }

      if (
        kind === 'dynamic' ||
        kind === 'catch-all' ||
        kind === 'optional-catch-all'
      ) {
        const routeParts = name.split('/');
        const pathnameParts = fixedPathname.split('/');

        for (let i = 0; i < routeParts.length; i++) {
          const part = routeParts[i];

          if (part.startsWith('[')) {
            pathnameParts[i] = routeParts[i];
          }

          if (part.includes('...')) {
            pathnameParts.splice(i, pathnameParts.length);
            routeParts.splice(i, routeParts.length);
            break;
          }
        }

        if (routeParts.join('/') === pathnameParts.join('/')) {
          return {
            filePath,
            kind,
            name,
            pathname,
            src,
            ...getParamsAndQuery(name, fixedPathname, url),
          };
        }
      }
    }

    return null;
  }

  return { routes, match };
}

function getRouteKind(route: string): MatchedBrisaRoute['kind'] {
  if (route.includes('[[...')) return 'optional-catch-all';
  if (route.includes('[...')) return 'catch-all';
  if (route.includes('[')) return 'dynamic';
  return 'exact';
}

function getParamsAndQuery(route: string, pathname: string, url: URL) {
  const routeParts = route.split('/');
  const pathnameParts = pathname.split('/');
  const params = routeParts.reduce(
    (acc, part, index) => {
      if (part.startsWith('[')) {
        const key = part.replace(EXTRACT_PARAM_KEY_REGEX, '');
        acc[key] = part.includes('...')
          ? pathnameParts.slice(index) ?? ''
          : pathnameParts[index] ?? '';
      }

      return acc;
    },
    {} as Record<string, string | string[]>,
  );

  const query = { ...params, ...Object.fromEntries(url.searchParams) };

  return { params, query };
}

function resolveRoutes({
  dir,
  fileExtensions = DEFAULT_EXTENSIONS,
}: FileSystemRouterOptions) {
  const routes: Record<string, string> = {};
  const files = fs.readdirSync(dir, {
    withFileTypes: true,
    recursive: true,
  });

  for (const file of files) {
    if (file.isDirectory()) continue;

    const ext = path.extname(file.name);

    if (!fileExtensions.includes(ext)) continue;

    const filePath = path.resolve(file.parentPath, file.name);
    let route = filePath
      .replace(ext, '')
      .replace(dir, '')
      .replace(ENDS_WITH_SLASH_INDEX_REGEX, '');

    if (route === '') route = '/';

    console.log({ route, filePath });
    routes[route] = filePath;
  }

  return routes;
}
