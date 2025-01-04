import path from 'node:path';
import importFileIfExists from '../import-file-if-exists';
import type { I18nConfig, InternalConstants, ProjectConstants } from '@/types';
import type { BunPlugin } from 'bun';
import {
  blueLog,
  cyanLog,
  greenLog,
  redLog,
  yellowLog,
} from '../log/log-color';
import { version } from '../../../package.json';
import { getRuntime } from '../js-runtime-util';

const WIN32_SEP_REGEX = /\\/g;
const PAGE_404 = '/_404';
const PAGE_500 = '/_500';
const OS_CAN_LOAD_BALANCE =
  process.platform !== 'darwin' && process.platform !== 'win32';

const staticExportOutputOption = new Set([
  'static',
  'desktop',
  'android',
  'ios',
]);

export function internalConstants(): InternalConstants {
  const currentScript = process.argv[1] ?? '';
  const { NODE_ENV } = process.env;
  const CLI_DIR = path.join('brisa', 'out', 'cli');
  // Note: process.env.IS_PROD is to be defined in the build process
  const IS_PRODUCTION =
    Boolean(process.env.IS_PROD) ||
    NODE_ENV === 'production' ||
    process.argv.some((t) => t === 'PROD');
  const IS_DEVELOPMENT =
    process.argv.some((t) => t === 'DEV') || NODE_ENV === 'development';
  const IS_SERVE_PROCESS =
    Boolean(process.env.IS_SERVE_PROCESS) ||
    Boolean(currentScript.endsWith(path.join(CLI_DIR, 'serve', 'index.js')));

  const ROOT_DIR = process.env.BRISA_ROOT_DIR ?? process.cwd();

  const IS_BUILD_PROCESS = Boolean(
    currentScript.endsWith(path.join(CLI_DIR, 'build.js')),
  );

  const BRISA_DIR =
    process.env.BRISA_DIR ??
    currentScript.replace(
      new RegExp(`${CLI_DIR.replace(WIN32_SEP_REGEX, '\\\\')}.*`),
      'brisa',
    );

  const SRC_DIR: string =
    process.env.BRISA_SRC_DIR ?? path.resolve(ROOT_DIR, 'src');
  const BUILD_DIR: string =
    process.env.BRISA_BUILD_FOLDER ?? path.resolve(ROOT_DIR, 'build');

  const WORKSPACE = IS_BUILD_PROCESS ? SRC_DIR : BUILD_DIR;

  return {
    WORKSPACE,
    JS_RUNTIME: getRuntime(),
    PAGE_404,
    PAGE_500,
    VERSION: version,
    RESERVED_PAGES: [PAGE_404, PAGE_500],
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    IS_SERVE_PROCESS,
    IS_BUILD_PROCESS,
    PORT: Number.parseInt(process.argv[2]) || 3000,
    BUILD_DIR,
    ROOT_DIR,
    BRISA_DIR,
    SRC_DIR,
    ASSETS_DIR: path.resolve(BUILD_DIR, 'public'),
    PAGES_DIR: path.resolve(BUILD_DIR, 'pages'),
    LOG_PREFIX: {
      WAIT: cyanLog('[ wait ]') + ' ',
      READY: greenLog('[ ready ] ') + ' ',
      INFO: blueLog('[ info ] ') + ' ',
      ERROR: redLog('[ error ] ') + ' ',
      WARN: yellowLog('[ warn ] ') + ' ',
      TICK: greenLog('✓ ') + ' ',
    },
    REGEX: {
      CATCH_ALL: /\[\[\.{3}.*?\]\]/g,
      DYNAMIC: /\[.*?\]/g,
      REST_DYNAMIC: /\[\.{3}.*?\]/g,
    },
    HEADERS: {
      CACHE_CONTROL: IS_PRODUCTION
        ? 'public, max-age=31536000, immutable'
        : 'no-store, must-revalidate',
    },
  };
}

export async function loadProjectConstants({
  IS_PRODUCTION,
  BUILD_DIR,
  WORKSPACE,
  ROOT_DIR,
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

  const defaultExternalDeps = [...getDevDeps(), 'lightningcss'];
  const CSS_FILES =
    (await importFileIfExists('css-files', BUILD_DIR))?.default ?? [];
  const integrations = await importFileIfExists(
    '_integrations',
    path.resolve(BUILD_DIR, 'web-components'),
  );
  const WEB_CONTEXT_PLUGINS = integrations?.webContextPlugins ?? [];
  const I18N_CONFIG = (await importFileIfExists('i18n', WORKSPACE))
    ?.default as I18nConfig;
  const CONFIG = {
    ...defaultConfig,
    ...((await importFileIfExists('brisa.config', ROOT_DIR))?.default ?? {}),
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
    CSS_FILES,
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
