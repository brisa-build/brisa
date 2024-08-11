import path from 'node:path';
import fs from 'node:fs';

type FileSystemRouterOptions = {
  dir: string;
  fileExtensions: string[];
};

const ENDS_WITH_SLASH_INDEX_REGEX = new RegExp(`${path.sep}index$`);
const ROUTES_CACHE = new Map<string, Record<string, string>>();

// Inspired on Bun.FileSystemRouter, but compatible with Node.js as well
export function fileSystemRouter(options: FileSystemRouterOptions) {
  const routes = resolveRoutes(options);

  return { routes };
}

function resolveRoutes({ dir, fileExtensions }: FileSystemRouterOptions) {
  if (ROUTES_CACHE.has(dir)) return ROUTES_CACHE.get(dir);

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

  ROUTES_CACHE.set(dir, routes);

  return routes;
}
