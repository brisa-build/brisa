import path from 'node:path';
import importFileIfExists from '../import-file-if-exists';
import { i18n, config, integrations, cssFiles } from 'brisa-project-internals';
import type { InternalConstants, ProjectConstants } from '@/types';
import type { BunPlugin } from 'bun';

const OS_CAN_LOAD_BALANCE =
  process.platform !== 'darwin' && process.platform !== 'win32';

const staticExportOutputOption = new Set([
  'static',
  'desktop',
  'android',
  'ios',
]);

export async function loadProjectConstants({
  IS_PRODUCTION,
  BUILD_DIR,
  WORKSPACE,
  ROOT_DIR,
  IS_BUILD_PROCESS,
}: InternalConstants): Promise<ProjectConstants> {
  const defaultConfig = {
    trailingSlash: false,
    assetPrefix: '',
    basePath: '',
    extendPlugins: (plugins: BunPlugin[]) => plugins,
    output: 'bun',
    clustering: IS_PRODUCTION && OS_CAN_LOAD_BALANCE,
    integrations: [],
    idleTimeout: 30,
  };

  const defaultExternalDeps = IS_BUILD_PROCESS
    ? [...getDevDeps(), 'lightningcss', '@tailwindcss/oxide']
    : [];
  const WEB_CONTEXT_PLUGINS = integrations?.webContextPlugins ?? [];
  const I18N_CONFIG = i18n?.default;
  const CONFIG = {
    ...defaultConfig,
    ...(config?.default ?? {}),
  };
  const IS_STATIC_EXPORT = staticExportOutputOption.has(CONFIG?.output);

  // Remove trailing slash from pages
  if (I18N_CONFIG?.pages) {
    I18N_CONFIG.pages = JSON.parse(
      JSON.stringify(I18N_CONFIG.pages, (key, value) =>
        typeof value === 'string' && value.length > 1
          ? value.replace(/\/$/g, '')
          : value,
      ),
    );
  }

  const LOCALES_SET = new Set(I18N_CONFIG?.locales || []) as Set<string>;

  if (CONFIG.basePath && !CONFIG.basePath.startsWith(path.sep)) {
    CONFIG.basePath = path.sep + CONFIG.basePath;
  }

  // Add external libraries to the list of external libraries
  if (!CONFIG.external) CONFIG.external = defaultExternalDeps;
  else CONFIG.external = [...CONFIG.external, ...defaultExternalDeps];

  // This is needed for some helpers like "navigate" to work properly
  // in the server side. (For the client-side it's solved during the build process)
  globalThis.__BASE_PATH__ = CONFIG.basePath;

  return {
    CSS_FILES: cssFiles,
    CONFIG,
    I18N_CONFIG,
    WEB_CONTEXT_PLUGINS,
    LOCALES_SET,
    IS_STATIC_EXPORT,
  };
}

function getDevDeps() {
  const packageJSONDir = process.env.npm_package_json;
  if (!packageJSONDir) return [];
  const packageJSON = require(packageJSONDir);
  return Object.keys(packageJSON.devDependencies || {});
}
