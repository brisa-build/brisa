import type { BrisaConstants, I18nConfig } from './types';
import {
  internalConstants,
  loadProjectConstants,
} from './utils/load-constants';

const internal = internalConstants();

let constants = {
  ...internal,
  ...(await loadProjectConstants(internal)),
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

// Update all that can change during hotreloading
export async function reinitConstants() {
  constants = globalThis.mockConstants = {
    ...constants,
    ...(await loadProjectConstants(internal)),
  };
}

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
  var __FILTER_DEV_RUNTIME_ERRORS__: string;
}

export default constants;
