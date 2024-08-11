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
  params?: Record<string, string>;
  query?: Record<string, string>;
};

const ENDS_WITH_SLASH_INDEX_REGEX = new RegExp(`${path.sep}index$`);

// Inspired on Bun.FileSystemRouter, but compatible with Node.js as well
export function fileSystemRouter(options: FileSystemRouterOptions) {
  const routes = resolveRoutes(options);

  function match(routeToMatch: string) {
    const url = new URL(routeToMatch, 'http://l');
    const pathname = url.pathname;

    for (const [name, filePath] of Object.entries(routes)) {
      const kind = getRouteKind(name);
      const params = getRouteParams(name, pathname);

      if (kind === 'exact' && name === pathname) {
        return {
          filePath,
          kind,
          name,
          pathname,
          params,
        };
      }

      if (
        kind === 'dynamic' ||
        kind === 'catch-all' ||
        kind === 'optional-catch-all'
      ) {
        const routeParts = name.split('/');
        const pathnameParts = pathname.split('/');

        for (let i = 0; i < routeParts.length; i++) {
          const part = routeParts[i];

          if (part.startsWith('[')) {
            pathnameParts.splice(i, 1);
            routeParts.splice(i, 1);
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
            params,
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

function getRouteParams(
  route: string,
  pathname: string,
): Record<string, string | string[]> | undefined {
  if (route.includes('[')) {
    const routeParts = route.split('/');
    const pathnameParts = pathname.split('/');

    return routeParts.reduce(
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
  }
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
