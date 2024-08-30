import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const isBun = typeof Bun !== 'undefined';

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
    if (!isBun) throw e;
    // This resolves "exports" inside the package.json of dependencies in Bun runtime
    // Issue: https://github.com/brisa-build/brisa/issues/434
    return Bun.resolveSync(
      id,
      parent ? path.dirname(parent) : import.meta.dirname,
    );
  }
}
