import type { BunPlugin } from 'bun';
import { resolve } from 'node:path';
import getImportableFilepath from '@/utils/get-importable-filepath';
import { getConstants } from '@/constants';

/**
 * This plugin substitute the dynamic imports of packages/brisa/src/brisa-project-internals.ts to
 * static imports. Useful to support to compile the app into binary to improve memory in runtime #628
 *
 * TODO: Currently is WIP. See TODO's of #628 to finish this.
 */
export default function attachBrisaProjectInternalsPlugin() {
  const { BUILD_DIR, ROOT_DIR } = getConstants();
  const middlewarePath = getImportableFilepath('middleware', BUILD_DIR);
  const middlewareExport = middlewarePath
    ? `export { default as middleware } from '${middlewarePath}';`
    : 'export const middleware = null;';

  const i18nPath = getImportableFilepath('i18n', BUILD_DIR);
  const i18nExport = i18nPath
    ? `export { default as i18n } from '${i18nPath}';`
    : 'export const i18n = null;';

  const configPath = getImportableFilepath('brisa.config', ROOT_DIR);
  const configExport = configPath
    ? `export { default as config } from '${configPath}';`
    : 'export const config = {};';

  const webIntegrationsPath = getImportableFilepath(
    '_integrations',
    resolve(BUILD_DIR, 'web-components'),
  );
  const webIntegrationsExport = webIntegrationsPath
    ? `export { default as integrations } from '${webIntegrationsPath}';`
    : 'export const integrations = null;';

  return {
    name: 'attach-brisa-project-internals',
    setup(build) {
      build.onResolve({ filter: /brisa-project-internals/ }, () => ({
        path: import.meta.filename,
      }));
      build.onLoad(
        { filter: new RegExp(import.meta.filename) },
        ({ loader }) => ({
          contents: `${middlewareExport}${i18nExport}${configExport}${webIntegrationsExport}`,
          loader,
        }),
      );
    },
  } satisfies BunPlugin;
}
