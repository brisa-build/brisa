import path from 'node:path';
import type { InternalConstants } from '@/types';
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
