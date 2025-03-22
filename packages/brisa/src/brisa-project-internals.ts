import importFileIfExists from '@/utils/import-file-if-exists';
import { getConstants } from '@/constants';

const { BUILD_DIR } = getConstants();

/**
 * WIP https://github.com/brisa-build/brisa/issues/628
 *
 * All these content is replaced in project build-time with the correct project content,
 * by packages/brisa/src/utils/attach-brisa-project-internals/index.ts
 *
 * Useful to avoid dynamic imports. Being possible to compile the app into binary to
 * improve memory in runtime.
 */
const middlewareModule = await importFileIfExists('middleware', BUILD_DIR);
export const middleware = middlewareModule?.default;

// TODO:
export const i18n = null;
export const config = null;
export const api = [];
export const layout = null;
export const websockets = null;
export const actions = null;
export const pages = [];
export const integrations = null;
export const cssFiles = [];
