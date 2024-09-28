import path from 'node:path';
import type { BunPlugin } from 'bun';
import { version } from '../package.json';
import type { BrisaConstants, Configuration, I18nConfig } from './types';
import importFileIfExists from './utils/import-file-if-exists';
import { hash } from '@/utils/wyhash';
import {
  blueLog,
  cyanLog,
  greenLog,
  redLog,
  yellowLog,
} from './utils/log/log-color';

const { NODE_ENV } = process.env;

// Note: process.env.IS_PROD is to be defined in the build process
const IS_PRODUCTION =
  Boolean(process.env.IS_PROD) ||
  NODE_ENV === 'production' ||
  process.argv.some((t) => t === 'PROD');

const CLI_DIR = path.join('brisa', 'out', 'cli');
const IS_SERVE_PROCESS =
  Boolean(process.env.IS_SERVE_PROCESS) ||
  Boolean(process.argv[1]?.endsWith?.(path.join(CLI_DIR, 'serve', 'index.js')));

const IS_STANDALONE_SERVER = Boolean(process.env.IS_STANDALONE_SERVER);

const IS_BUILD_PROCESS = Boolean(
  process.argv[1]?.endsWith?.(path.join(CLI_DIR, 'build.js')),
);

const BRISA_DIR = process.argv[1]?.replace(new RegExp(`${CLI_DIR}.*`), 'brisa');

const rootDir = IS_STANDALONE_SERVER ? import.meta.dirname : process.cwd();
const staticExportOutputOption = new Set([
  'static',
  'desktop',
  'android',
  'ios',
]);

const srcDir = IS_STANDALONE_SERVER
  ? import.meta.dirname
  : path.resolve(rootDir, 'src');

const buildDir = IS_STANDALONE_SERVER
  ? import.meta.dirname
  : (process.env.BRISA_BUILD_FOLDER ?? path.resolve(rootDir, 'build'));

const WORKSPACE = IS_BUILD_PROCESS ? srcDir : buildDir;

const PAGE_404 = '/_404';
const PAGE_500 = '/_500';
const CSS_FILES = (await importFileIfExists('css-files.json', buildDir))?.default ?? [];
const integrations = await importFileIfExists(
  '_integrations',
  path.resolve(buildDir, 'web-components'),
);
const I18N_CONFIG = (await importFileIfExists('i18n', WORKSPACE))
  ?.default as I18nConfig;
const CONFIG =
  (await importFileIfExists('brisa.config', rootDir))?.default ?? {};

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

if (CONFIG?.basePath && !CONFIG.basePath.startsWith(path.sep)) {
  CONFIG.basePath = path.sep + CONFIG.basePath;
}

// This is needed for some helpers like "navigate" to work properly
// in the server side. (For the client-side it's solved during the build process)
globalThis.__BASE_PATH__ = CONFIG.basePath;

const OS_CAN_LOAD_BALANCE =
  process.platform !== 'darwin' && process.platform !== 'win32';

const CACHE_CONTROL = IS_PRODUCTION
  ? 'public, max-age=31536000, immutable'
  : 'no-store, must-revalidate';

const defaultConfig = {
  trailingSlash: false,
  assetPrefix: '',
  basePath: '',
  extendPlugins: (plugins: BunPlugin[]) => plugins,
  output: 'bun',
  clustering: IS_PRODUCTION && OS_CAN_LOAD_BALANCE,
};

const constants = {
  JS_RUNTIME: typeof Bun !== 'undefined' ? 'bun' : 'node',
  PAGE_404,
  PAGE_500,
  VERSION: version,
  VERSION_HASH: hash(version),
  WEB_CONTEXT_PLUGINS: integrations?.webContextPlugins ?? [],
  RESERVED_PAGES: [PAGE_404, PAGE_500],
  IS_PRODUCTION,
  CSS_FILES,
  IS_DEVELOPMENT:
    process.argv.some((t) => t === 'DEV') || NODE_ENV === 'development',
  IS_SERVE_PROCESS,
  IS_BUILD_PROCESS,
  PORT: Number.parseInt(process.argv[2]) || 3000,
  BUILD_DIR: buildDir,
  ROOT_DIR: rootDir,
  BRISA_DIR,
  SRC_DIR: srcDir,
  ASSETS_DIR: path.resolve(buildDir, 'public'),
  PAGES_DIR: path.resolve(buildDir, 'pages'),
  I18N_CONFIG,
  LOG_PREFIX: {
    WAIT: cyanLog('[ wait ]') + ' ',
    READY: greenLog('[ ready ] ') + ' ',
    INFO: blueLog('[ info ] ') + ' ',
    ERROR: redLog('[ error ] ') + ' ',
    WARN: yellowLog('[ warn ] ') + ' ',
    TICK: greenLog('✓ ') + ' ',
  },
  LOCALES_SET: new Set(I18N_CONFIG?.locales || []) as Set<string>,
  CONFIG: { ...defaultConfig, ...CONFIG } as Configuration,
  IS_STATIC_EXPORT: staticExportOutputOption.has(CONFIG?.output),
  REGEX: {
    CATCH_ALL: /\[\[\.{3}.*?\]\]/g,
    DYNAMIC: /\[.*?\]/g,
    REST_DYNAMIC: /\[\.{3}.*?\]/g,
  },
  HEADERS: {
    CACHE_CONTROL,
  },
} satisfies BrisaConstants;

/**
 * TODO: Remove this function and use directly the constants when Bun supports mock modules.
 *
 * 🚨 This is a workaround meanwhile Bun doesn't support mock modules. After that, we can
 * refactor to use directly the constants without the need of this function and replace
 * it in all the codebase and implement the mock modules in the tests.
 */
export const getConstants = (): BrisaConstants =>
  globalThis.mockConstants
    ? (globalThis.mockConstants as typeof constants)
    : constants;

declare global {
  var mockConstants: Partial<BrisaConstants> | undefined;
  var REGISTERED_ACTIONS: Function[] | undefined;
  var FORCE_SUSPENSE_DEFAULT: boolean | undefined;
  var BrisaRegistry: Map<string, number>;
  var lastContextProviderId: number;
  var watcher: import('node:fs').FSWatcher;
  var __WEB_CONTEXT_PLUGINS__: boolean;
  var __RPC_LAZY_FILE__: string;
  var __BASE_PATH__: string;
  var __ASSET_PREFIX__: string;
  var __TRAILING_SLASH__: boolean;
  var __USE_LOCALE__: boolean;
  var __IS_STATIC__: boolean;
  var __USE_PAGE_TRANSLATION__: boolean;
}

export default constants;
