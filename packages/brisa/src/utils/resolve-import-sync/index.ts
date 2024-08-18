import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

/**
 * Synchronously resolves the path of an import, which is particularly useful
 * for converting relative imports or TypeScript aliases to absolute paths.
 */
export default function resolveImportSync(id: string, parent?: string) {
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
}
