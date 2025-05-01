import type { BunPlugin } from 'bun';
import { resolve, join } from 'node:path';
import getImportableFilepath from '@/utils/get-importable-filepath';
import { getConstants } from '@/constants';
import { fileSystemRouter } from '@/utils/file-system-router';

const namespace = 'brisa-project-internals';
const toImport = (importString: string, from: string | null) =>
  from ? `import ${importString} from '${from}';` : '';

/**
 * This plugin substitute the dynamic imports of packages/brisa/src/brisa-project-internals.ts to
 * static imports. Useful to support to compile the app into binary to improve memory in runtime #628
 *
 * TODO: Currently is WIP. See TODO's of #628 to finish this.
 */
export default function attachBrisaProjectInternalsPlugin() {
  const { BUILD_DIR, ROOT_DIR } = getConstants();
  const actionsPath = getImportableFilepath('actions', BUILD_DIR);
  const middlewarePath = getImportableFilepath('middleware', BUILD_DIR);
  const i18nPath = getImportableFilepath('i18n', BUILD_DIR);
  const configPath = getImportableFilepath('brisa.config', ROOT_DIR);
  const webIntegrationsPath = getImportableFilepath(
    '_integrations',
    resolve(BUILD_DIR, 'web-components'),
  );
  const layoutPath = getImportableFilepath('layout', BUILD_DIR);
  const websocketPath = getImportableFilepath('websocket', BUILD_DIR);
  const cssPath = getImportableFilepath('css-files', BUILD_DIR);
  const pages = getPagesExport();
  const apiEndpoints = getApiEndpointsExport();

  const contents = `
    ${toImport('* as actions', actionsPath)}
    ${toImport('* as middleware', middlewarePath)}
    ${toImport('* as i18n', i18nPath)}
    ${toImport('* as config', configPath)}
    ${toImport('* as integrations', webIntegrationsPath)}
    ${toImport('* as layoutModule', layoutPath)}
    ${toImport('* as websocket', websocketPath)}
    ${toImport('{ default as cssFiles }', cssPath)}
    ${pages.imports}
    ${apiEndpoints.imports}

    ${setDefaults({
      actionsPath,
      middlewarePath,
      i18nPath,
      configPath,
      webIntegrationsPath,
      layoutPath,
      websocketPath,
      cssPath,
    })}
    ${pages.objectCreation}
    ${apiEndpoints.objectCreation}

    export default function getProjectInternals() {
      return {
        actions,
        middleware,
        i18n,
        config,
        integrations,
        layoutModule,
        websocket,
        cssFiles,
        pages,
        apiEndpoints,
      }
    }
  `;

  return {
    name: 'attach-brisa-project-internals',
    setup(build) {
      // Note: Without this, using build.onLoad alone with the /brisa-project-internals/ regex
      // works correctly only when using a symlink. After creating a Tarball, however, it fails
      // to correctly resolve the reference.
      // To fix this, it's necessary to first use build.onResolve with this "trick" before onLoad.
      // This ensures it works in both cases — with a symlink and after generating the Tarball.
      // It's important to keep this structure and not "simplify" it, as simplifying would break Tarball usage.
      build.onResolve({ filter: /brisa-project-internals/ }, ({ path }) => ({
        path,
        namespace,
      }));

      build.onLoad({ filter: /.*/, namespace }, ({ loader }) => ({
        contents,
        loader,
      }));
    },
  } satisfies BunPlugin;
}

function getPagesExport() {
  const { PAGES_DIR } = getConstants();
  const { routes } = fileSystemRouter({ dir: PAGES_DIR });
  let count = 0;
  let imports = '';
  let objectCreation = 'const pages = {};';

  for (const [name, filePath] of routes) {
    imports += `import * as p${++count} from "${filePath}";\n`;
    objectCreation += `pages["${name}"] = p${count};\n`;
  }

  return {
    imports,
    objectCreation,
  };
}

function getApiEndpointsExport() {
  const { BUILD_DIR } = getConstants();
  const { routes } = fileSystemRouter({ dir: join(BUILD_DIR, 'api') });
  let count = 0;
  let imports = '';
  let objectCreation = 'const apiEndpoints = {};';

  for (const [name, filePath] of routes) {
    const endpointName = name === '/' ? '/api' : `/api${name}`;
    imports += `import * as a${++count} from "${filePath}";\n`;
    objectCreation += `apiEndpoints["${endpointName}"] = a${count};\n`;
  }

  return {
    imports,
    objectCreation,
  };
}

function setDefaults({
  actionsPath,
  middlewarePath,
  i18nPath,
  configPath,
  webIntegrationsPath,
  layoutPath,
  websocketPath,
  cssPath,
}: Record<string, string | null>) {
  let res = '';

  if (!actionsPath) res += 'const actions = null;\n';
  if (!middlewarePath) res += 'const middleware = null;\n';
  if (!i18nPath) res += 'const i18n = null;\n';
  if (!configPath) res += 'const config = {};\n';
  if (!webIntegrationsPath) res += 'const integrations = null;\n';
  if (!layoutPath) res += 'const layoutModule = null;\n';
  if (!websocketPath) res += 'const websocket = null;\n';
  if (!cssPath) res += 'const cssFiles = [];\n';

  return res;
}
