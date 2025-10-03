import { getConstants } from '@/constants';
import { join,basename } from 'node:path';



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

  // Always get relative path
  let relativePath = pagePath.startsWith(PAGES_DIR)
    ? pagePath.slice(PAGES_DIR.length)
    : basename(pagePath);

  // Replace slashes, dots, dashes
  const tempName = relativePath.replace(/[\\/.-]/g, '_');

  return join(BUILD_DIR, '_brisa', `temp${tempName}.ts`).replace(/\\/g, '/'); // Windows-safe
}
