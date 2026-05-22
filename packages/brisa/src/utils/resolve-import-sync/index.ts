import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const isBun = typeof Bun !== 'undefined';
const extensions = ['.tsx', '.js', '.ts', '.mjs', '.cjs', 'mdx'];

/**
 * Synchronously resolves the path of an import, which is particularly useful
 * for converting relative imports or TypeScript aliases to absolute paths.
 */
export default function resolveImportSync(id: string, parent?: string) {
  try {
    const req = createRequire(parent ?? path.resolve(process.cwd(), 'src'));

    return req.resolve(id, {
      paths: parent
        ? [
            path.resolve(
              parent.startsWith('file://') ? fileURLToPath(parent) : parent,
              '..',
            ),
          ]
        : undefined,
    });
  } catch (e) {
    // Bun caches module resolution failures, so if a file is deleted and
    // recreated (as happens during build), createRequire().resolve() and
    // Bun.resolveSync() may return stale cached failures. Use filesystem
    // checks as fallback to bypass the cache.
    for (const extension of extensions) {
      const filePath = path.join(parent ?? '', id + extension);
      const fileWithIndexPath = path.join(
        parent ?? '',
        id,
        'index' + extension,
      );

      if (fs.existsSync(filePath)) return filePath;
      if (fs.existsSync(fileWithIndexPath)) return fileWithIndexPath;
    }

    if (isBun) {
      // This resolves "exports" inside the package.json of dependencies in Bun runtime
      // Issue: https://github.com/brisa-build/brisa/issues/434
      // This error only happens in Build-time, so Bun.js:
      // Related Bun issue: https://github.com/oven-sh/bun/issues/4668
      return Bun.resolveSync(
        id,
        parent ? path.dirname(parent) : import.meta.dirname,
      );
    }

    throw e;
  }
}
