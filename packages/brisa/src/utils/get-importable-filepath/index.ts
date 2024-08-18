import resolveImportSync from '@/utils/resolve-import-sync';
import path from 'node:path';

export default function getImportableFilepath(filename: string, dir: string) {
  try {
    return resolveImportSync(path.join(dir, filename));
  } catch (e) {
    return null;
  }
}
