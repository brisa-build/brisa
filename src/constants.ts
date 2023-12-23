import path from "node:path";
import { Configuration, I18nConfig } from "./types";
import getRootDir from "./utils/get-root-dir";
import importFileIfExists from "./utils/import-file-if-exists";

const rootDir = getRootDir();
const srcDir = path.join(rootDir, "src");
const buildDir = path.join(rootDir, "build");
const PAGE_404 = "/_404";
const PAGE_500 = "/_500";
const I18N_CONFIG = (await importFileIfExists("i18n", buildDir))
  ?.default as I18nConfig;
const CONFIG =
  (await importFileIfExists("brisa.config", rootDir))?.default ?? {};

const defaultConfig = {
  trailingSlash: false,
  assetPrefix: "",
  plugins: [],
};

const BOOLEANS_IN_HTML = new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected",
]);

const constants = {
  PAGE_404,
  PAGE_500,
  RESERVED_PAGES: [PAGE_404, PAGE_500],
  IS_PRODUCTION:
    process.argv.some((t) => t === "PROD") ||
    process.env.NODE_ENV === "production",
  IS_DEVELOPMENT:
    process.argv.some((t) => t === "DEV") ||
    process.env.NODE_ENV === "development",
  PORT: parseInt(process.argv[2]) || 0,
  BUILD_DIR: buildDir,
  ROOT_DIR: rootDir,
  SRC_DIR: srcDir,
  ASSETS_DIR: path.join(buildDir, "public"),
  PAGES_DIR: path.join(buildDir, "pages"),
  I18N_CONFIG,
  LOG_PREFIX: {
    WAIT: Bun.enableANSIColors ? `[ \x1b[36mwait\x1b[0m ]  ` : "[ wait ] ",
    READY: Bun.enableANSIColors ? `[ \x1b[32mready\x1b[0m ] ` : "[ ready ] ",
    INFO: Bun.enableANSIColors ? `[ \x1b[34minfo\x1b[0m ]  ` : "[ info ] ",
    ERROR: Bun.enableANSIColors ? `[ \x1b[31merror\x1b[0m ] ` : "[ error ] ",
    WARN: Bun.enableANSIColors ? `[ \x1b[33mwarn\x1b[0m ]  ` : "[ warn ] ",
  },
  LOCALES_SET: new Set(I18N_CONFIG?.locales || []) as Set<string>,
  CONFIG: { ...defaultConfig, ...CONFIG } as Configuration,
  REGEX: {
    CATCH_ALL: /\[\[\.{3}.*?\]\]/g,
    DYNAMIC: /\[.*?\]/g,
    REST_DYNAMIC: /\[\.{3}.*?\]/g,
  },
  BOOLEANS_IN_HTML,
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
  var BrisaRegistry: Map<string, number>;
  var lastContextProviderId: number;
}

export default getConstants;
