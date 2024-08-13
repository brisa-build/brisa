import path from 'node:path';
import fs from 'node:fs';

type FileSystemRouterOptions = {
  dir: string;
  fileExtensions: string[];
};

// TODO: move to index.d.ts
export type MatchedBrisaRoute = {
  filePath: string;
  kind: 'exact' | 'catch-all' | 'optional-catch-all' | 'dynamic';
  name: string;
  pathname: string;
  params?: Record<string, string | string[]>;
  query?: Record<string, string | string[]>;
};

const ENDS_WITH_SLASH_INDEX_REGEX = new RegExp(`${path.sep}index$`);

// Inspired on Bun.FileSystemRouter, but compatible with Node.js as well
export function fileSystemRouter(options: FileSystemRouterOptions) {
  const routes = resolveRoutes(options);

  function match(routeToMatch: string) {
    const url = new URL(routeToMatch, 'http://l');
    const pathname = url.pathname;
    const fixedPathname = pathname.replace(/\/$/, '') || '/';

    for (const [name, filePath] of Object.entries(routes)) {
      const kind = getRouteKind(name);

      if (kind === 'exact' && name === fixedPathname) {
        return {
          filePath,
          kind,
          name,
          pathname,
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
        const key = part.replace(/\[|\]|\./g, '');
        acc[key] = part.includes('...')
          ? pathnameParts.slice(index)
          : pathnameParts[index];
      }

      return acc;
    },
    {} as Record<string, string | string[]>,
  );

  const query = { ...params, ...Object.fromEntries(url.searchParams) };

  return { params, query };
}

function resolveRoutes({ dir, fileExtensions }: FileSystemRouterOptions) {
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

    routes[route] = filePath;
  }

  return routes;
}
