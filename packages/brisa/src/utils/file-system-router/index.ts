import path from 'node:path';
import fs from 'node:fs';

const finalSlashIndex = new RegExp(`${path.sep}index$`);

// Inspired on Bun.FileSystemRouter, but runtime-agnostic.
export function fileSystemRouter({
  dir,
  fileExtensions,
}: {
  dir: string;
  fileExtensions: string[];
}) {
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
      .replace(finalSlashIndex, '');

    if (route === '') route = '/';

    routes[route] = filePath;
  }

  return {
    routes,
  };
}
