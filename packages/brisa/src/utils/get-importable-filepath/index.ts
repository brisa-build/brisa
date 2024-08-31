import resolveImportSync from '@/utils/resolve-import-sync';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const isRuntimeWithFileSchemaOnImport = typeof Bun === 'undefined';

export default function getImportableFilepath(
  filename: string,
  dir: string,
  useFileSchema?: boolean,
) {
  try {
    const filePath = resolveImportSync(path.join(dir, filename));
    return pathToFileURLWhenNeeded(filePath, useFileSchema);
  } catch (e) {
    return null;
  }
}

// Node.js needs absolute specifiers with file:// schema
// Documentation: https://nodejs.org/api/esm.html#import-specifiers
export function pathToFileURLWhenNeeded(
  filePath: string,
  useFileSchema = isRuntimeWithFileSchemaOnImport,
) {
  return useFileSchema ? pathToFileURL(filePath).href : filePath;
}
