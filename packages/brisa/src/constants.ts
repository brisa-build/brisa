import path from 'node:path';
import type { BunPlugin } from 'bun';
import { version } from '../package.json';
import type { BrisaConstants, Configuration, I18nConfig } from './types';
import importFileIfExists from './utils/import-file-if-exists';
import {
  blueLog,
  cyanLog,
  greenLog,
  redLog,
  yellowLog,
} from './utils/log/log-color';

const IS_SERVE_PROCESS = Bun.main.endsWith(
  path.join('brisa', 'out', 'cli', 'serve', 'index.js'),
);
const rootDir = process.cwd();
const staticExportOutputOption = new Set([
  'static',
  'desktop',
  'android',
  'ios',
]);
const srcDir = path.resolve(rootDir, 'src');
const buildDir =
  process.env.BRISA_BUILD_FOLDER ?? path.resolve(rootDir, 'build');
const WORKSPACE = IS_SERVE_PROCESS ? buildDir : srcDir;
const PAGE_404 = '/_404';
const PAGE_500 = '/_500';
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

const defaultConfig = {
  trailingSlash: false,
  assetPrefix: '',
  basePath: '',
  extendPlugins: (plugins: BunPlugin[]) => plugins,
  output: 'server',
};

const BOOLEANS_IN_HTML = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'disabled',
  'formnovalidate',
  'hidden',
  'indeterminate',
  'ismap',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'seamless',
  'selected',
  'data-action',
]);

const { NODE_ENV } = process.env;

const IS_PRODUCTION =
  process.argv.some((t) => t === 'PROD') || NODE_ENV === 'production';
const CACHE_CONTROL = IS_PRODUCTION
  ? 'public, max-age=31536000, immutable'
  : 'no-store, must-revalidate';

const constants = {
  PAGE_404,
  PAGE_500,
  VERSION: version,
  VERSION_HASH: Bun.hash(version),
  WEB_CONTEXT_PLUGINS: integrations?.webContextPlugins ?? [],
  RESERVED_PAGES: [PAGE_404, PAGE_500],
  IS_PRODUCTION,
  IS_DEVELOPMENT:
    process.argv.some((t) => t === 'DEV') || NODE_ENV === 'development',
  IS_SERVE_PROCESS,
  PORT: Number.parseInt(process.argv[2]) || 0,
  BUILD_DIR: buildDir,
  ROOT_DIR: rootDir,
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
  BOOLEANS_IN_HTML,
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
export const getConstants = () =>
  globalThis.mockConstants
    ? (globalThis.mockConstants as typeof constants)
    : constants;

declare global {
  var mockConstants: Partial<typeof constants> | undefined;
  var REGISTERED_ACTIONS: Function[] | undefined;
  var FORCE_SUSPENSE_DEFAULT: boolean | undefined;
  var BrisaRegistry: Map<string, number>;
  var lastContextProviderId: number;
  var watcher: import('node:fs').FSWatcher;
  var __WEB_CONTEXT_PLUGINS__: boolean;
  var __RPC_LAZY_FILE__: string;
  var __BASE_PATH__: string;
}

export default constants;
