import { resolve } from 'node:path';
import importFileIfExists from '@/utils/import-file-if-exists';
import { internalConstants } from '@/utils/load-constants';
import { pathToFileURLWhenNeeded } from '@/utils/get-importable-filepath';
import type { I18nConfig } from 'brisa';

// All this is temporal to work in DEV (brisa dev), in the future DEV is going to work
// in the same way that PROD works (without dynamic imports and these constants would
// be needed only in build-time, inside attach-brisa-project-internals)
const { BUILD_DIR, WORKSPACE, ROOT_DIR } = internalConstants();

/**
 * WIP https://github.com/brisa-build/brisa/issues/628
 *
 * All these content is replaced in project build-time with the correct project content,
 * by packages/brisa/src/utils/attach-brisa-project-internals/index.ts
 *
 * Useful to avoid dynamic imports. Being possible to compile the app into binary to
 * improve memory in runtime.
 */
export const middleware = (await importFileIfExists('middleware', BUILD_DIR))
  ?.default;

export const i18n = (await importFileIfExists('i18n', WORKSPACE))
  ?.default as I18nConfig;

export const config =
  (await importFileIfExists('brisa.config', ROOT_DIR))?.default ?? {};

export const integrations = await importFileIfExists(
  '_integrations',
  resolve(BUILD_DIR, 'web-components'),
);

export const layoutModule = await importFileIfExists('layout', BUILD_DIR);

// All dynamic pages (for dev)
export const pages = new Proxy({} as Record<string, Promise<any>>, {
  get(target, filePath: string) {
    return import(pathToFileURLWhenNeeded(filePath));
  },
});

// TODO:
export const cssFiles = [];
export const api = [];
export const websockets = null;
export const actions = null;
