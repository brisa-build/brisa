import { getConstants } from '@/constants';
import { join, sep } from 'node:path';

const EXTENSION_REGEX = /\.[a-z]+$/;

export function getTempPageName(pagePath: string) {
  const { PAGES_DIR, BUILD_DIR } = getConstants();
  const tempName = pagePath
    .replace(PAGES_DIR, '')
    .replaceAll(sep, '-')
    .replace(EXTENSION_REGEX, '');

  return join(BUILD_DIR, '_brisa', `temp${tempName}.ts`);
}
