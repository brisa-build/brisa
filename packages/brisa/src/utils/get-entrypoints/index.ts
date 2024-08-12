import { fileSystemRouter } from '@/utils/file-system-router';
import isTestFile from '@/utils/is-test-file';
import fs from 'node:fs';
import path from 'node:path';

const fileExtensions = ['.tsx', '.ts', '.js', '.jsx', '.cjs', '.mjs', '.mdx'];

export default function getEntrypoints(dir: string, separator = path.sep) {
  if (!fs.existsSync(dir)) return [];
  const router = getEntrypointsRouter(dir);

  const routes = [];

  for (const route of Object.values(router.routes)) {
    if (isTestFile(route, true)) continue;
    // Note: FileSystemsRouter returns routes with '/' separator (even on Windows)
    routes.push(route.replaceAll('/', separator));
  }

  return routes;
}

export function getEntrypointsRouter(dir: string) {
  return fileSystemRouter({ dir, fileExtensions });
}
