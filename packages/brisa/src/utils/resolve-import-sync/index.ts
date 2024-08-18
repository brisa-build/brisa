import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

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
