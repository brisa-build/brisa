import resolveImportSync from '@/utils/resolve-import-sync';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export default function getImportableFilepath(
  filename: string,
  dir: string,
  useFileSchema = typeof Bun === 'undefined',
) {
  try {
    const filePath = resolveImportSync(path.join(dir, filename));
    // Node.js needs absolute specifiers with file:// schema
    // Documentation: https://nodejs.org/api/esm.html#import-specifiers
    return useFileSchema ? pathToFileURL(filePath).href : filePath;
  } catch (e) {
    return null;
  }
}
