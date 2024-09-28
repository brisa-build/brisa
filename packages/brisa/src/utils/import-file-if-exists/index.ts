import path from 'node:path';
import getImportableFilepath from '@/utils/get-importable-filepath';

export default async function importFileIfExists(
  filename: 'middleware' | 'i18n' | 'brisa.config' | '_integrations' | 'css-files.json',
  dir = path.join(process.cwd(), 'build'),
) {
  const importablePath = getImportableFilepath(filename, dir);

  if (!importablePath) return null;

  return await import(importablePath);
}
