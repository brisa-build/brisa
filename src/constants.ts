import path from "node:path";
import getWebComponentsList from "./utils/get-web-components-list";
import getRootDir from "./utils/get-root-dir";
import importFileIfExists from "./utils/import-file-if-exists";
import { Configuration, I18nConfig } from "./types";

const rootDir = getRootDir();
const srcDir = getRootDir("development");
const PAGE_404 = "/_404";
const PAGE_500 = "/_500";
const I18N_CONFIG = (await importFileIfExists("i18n", rootDir))
  ?.default as I18nConfig;
const CONFIG_DIR = path.join(srcDir, "..");
const CONFIG =
  (await importFileIfExists("brisa.config", CONFIG_DIR))?.default ?? {};

const defaultConfig = {
  trailingSlash: false,
  assetPrefix: "",
  plugins: [],
};

const constants = {
  PAGE_404,
  PAGE_500,
  RESERVED_PAGES: [PAGE_404, PAGE_500],
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  PORT: parseInt(process.argv[2]) || 0,
  ROOT_DIR: rootDir,
  SRC_DIR: srcDir,
  ASSETS_DIR: path.join(rootDir, "public"),
  PAGES_DIR: path.join(rootDir, "pages"),
  I18N_CONFIG,
  WEB_COMPONENTS: getWebComponentsList(srcDir),
  LOCALES_SET: new Set(I18N_CONFIG?.locales || []) as Set<string>,
  CONFIG: { ...defaultConfig, ...CONFIG } as Configuration,
  REGEX: {
    CATCH_ALL: /\[\[\.{3}.*?\]\]/g,
    DYNAMIC: /\[.*?\]/g,
    REST_DYNAMIC: /\[\.{3}.*?\]/g,
  },
};

/**
 * TODO: Remove this function and use directly the constants when Bun supports mock modules.
 *
 * 🚨 This is a workaround meanwhile Bun doesn't support mock modules. After that, we can
 * refactor to use directly the constants without the need of this function and replace
 * it in all the codebase and implement the mock modules in the tests.
 */
const getConstants = () =>
  globalThis.mockConstants
    ? (globalThis.mockConstants as typeof constants)
    : constants;

declare global {
  var mockConstants: Partial<typeof constants> | undefined;
}

export default getConstants;
