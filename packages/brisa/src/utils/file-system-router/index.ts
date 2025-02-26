import path from 'node:path';
import fs from 'node:fs';
import type { MatchedBrisaRoute } from '@/types';
import type { FileSystemRouterOptions } from '@/types/server';
import isTestFile from '@/utils/is-test-file';

const ENDS_WITH_SLASH_INDEX_REGEX = /[\\|/]+index$/;
const DEFAULT_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.mjs', '.cjs', '.js'];
const MULTI_SLASH_REGEX = /(?<!:)\/{2,}/g;
const TRAILING_SLASH_REGEX = /\/$/;
const EXTRACT_PARAM_KEY_REGEX = /\[|\]|\./g;
const WINDOWS_PATH_REGEX = /\\/g;
const DIGIT_REGEX = /\d+/;
const SYMBOLS = new Set([
  '[',
  '_',
  '@',
  '$',
  '~',
  '%',
  '^',
  '&',
  '*',
  '(',
  '+',
  '=',
]);

// Inspired on Bun.FileSystemRouter, but compatible with Node.js/Deno as well
export function fileSystemRouter(options: FileSystemRouterOptions) {
  const routes = Object.entries(resolveRoutes(options)).sort(
    sortPathsBySegments,
  );

  function match(routeToMatch: string): MatchedBrisaRoute | null {
    const url = new URL(
      routeToMatch.replace(MULTI_SLASH_REGEX, '/'),
      'http://l',
    );
    const pathname = decodeURIComponent(url.pathname + url.search + url.hash);
    const fixedPathname = decodeURIComponent(
      url.pathname.replace(TRAILING_SLASH_REGEX, '') || '/',
    ).trim();

    for (const [name, filePath] of routes) {
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

export function normalizeRoute(filePath: string, dir: string, ext: string) {
  return filePath
    .replace(ext, '')
    .replace(dir, '')
    .replace(ENDS_WITH_SLASH_INDEX_REGEX, '')
    .replace(WINDOWS_PATH_REGEX, '/');
}

function getRouteKind(route: string): MatchedBrisaRoute['kind'] {
  if (route.includes('[[...')) return 'optional-catch-all';
  if (route.includes('[...')) return 'catch-all';
  if (route.includes('[')) return 'dynamic';
  return 'exact';
}

function getURLParams(url: URL) {
  const params: Record<string, string | string[]> = {};
  for (const key of url.searchParams.keys()) {
    params[key] = url.searchParams.getAll(key);

    if (params[key].length === 1) {
      params[key] = params[key][0];
    }
  }

  return params;
}

function getParamsAndQuery(route: string, pathname: string, url: URL) {
  const routeParts = route.split('/');
  const pathnameParts = pathname.split('/');
  const params = routeParts.reduce(
    (acc, part, index) => {
      if (part.startsWith('[')) {
        const key = part.replace(EXTRACT_PARAM_KEY_REGEX, '');
        acc[key] = part.includes('...')
          ? (pathnameParts.slice(index) ?? '')
          : (pathnameParts[index] ?? '');
      }

      return acc;
    },
    {} as Record<string, string | string[]>,
  );

  const query = { ...params, ...getURLParams(url) };

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
    if (file.isDirectory() || isTestFile(file.name, true)) continue;

    const ext = fileExtensions.find((ext) => file.name.endsWith(ext));

    if (!ext) continue;

    const filePath = path.resolve(file.parentPath, file.name);
    let route = normalizeRoute(filePath, dir, ext);

    if (route === '') route = '/';

    routes[route] = filePath;
  }

  return routes;
}

// Be sure in all OS the order is the same
function sortPathsBySegments([a]: [string, string], [b]: [string, string]) {
  const partsA = a.split('/');
  const partsB = b.split('/');
  const len = Math.min(partsA.length, partsB.length);

  for (let i = 0; i < len; i++) {
    const partA = partsA[i];
    const partB = partsB[i];
    const isPartASymbol = SYMBOLS.has(partA[0]);
    const isPartBSymbol = SYMBOLS.has(partB[0]);
    const numA = Number.parseInt('' + partA.match(DIGIT_REGEX), 10);
    const numB = Number.parseInt('' + partB.match(DIGIT_REGEX), 10);

    if (!isNaN(numA) && !isNaN(numB)) {
      const numComparison = numA - numB;
      if (numComparison !== 0) return numComparison;
    }

    if (isPartASymbol && !isPartBSymbol) {
      return 1;
    }

    if (!isPartASymbol && isPartBSymbol) {
      return -1;
    }

    const comparison = partA.localeCompare(partB, 'en', {
      sensitivity: 'base',
    });
    if (comparison !== 0) return comparison;
  }

  return partsA.length - partsB.length;
}
