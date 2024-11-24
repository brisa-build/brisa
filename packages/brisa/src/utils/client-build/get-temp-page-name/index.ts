import { getConstants } from '@/constants';
import { join, sep } from 'node:path';

const REGEX = new RegExp(`${sep}|-|\\.[a-z]+$`, 'g');

/**
 * Generates a temporary TypeScript file path for a given page.
 * This is used during the build process to create intermediate files.
 *
 * This function is part of the client build process. During the server build,
 * all Web Components used on a page are analyzed and associated with their
 * respective entrypoints.
 *
 * For each entrypoint, the client build requires a temporary file that contains:
 *
 * 1. Import statements for all the Web Components needed by the client page.
 * 2. Definitions for those Web Components, ensuring they are registered correctly.
 *
 * This function creates a unique temporary file path for each entrypoint, ensuring
 * that the client build can correctly generate the necessary imports and definitions.
 */
export function getTempPageName(pagePath: string) {
  const { PAGES_DIR, BUILD_DIR } = getConstants();

  const tempName = pagePath.replace(PAGES_DIR, '').replace(REGEX, resolveRegex);

  return join(BUILD_DIR, '_brisa', `temp${tempName}.ts`);
}

function resolveRegex(match: string) {
  if (match === sep) return '-';
  if (match === '-') return '_';
  return '';
}
