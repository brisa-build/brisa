import path from "node:path";
import type { Configuration, I18nConfig } from "./types";
import getRootDir from "./utils/get-root-dir";
import importFileIfExists from "./utils/import-file-if-exists";
import {
  blueLog,
  cyanLog,
  greenLog,
  redLog,
  yellowLog,
} from "./utils/log/log-color";

const rootDir = getRootDir();
const staticExportOutputOption = new Set(["static", "desktop"]);
const srcDir = path.join(rootDir, "src");
const buildDir = process.env.BRISA_BUILD_FOLDER ?? path.join(rootDir, "build");
const PAGE_404 = "/_404";
const PAGE_500 = "/_500";
const I18N_CONFIG = (await importFileIfExists("i18n", buildDir))
  ?.default as I18nConfig;
const CONFIG =
  (await importFileIfExists("brisa.config", rootDir))?.default ?? {};

// Remove trailing slash from pages
if (I18N_CONFIG?.pages) {
  I18N_CONFIG.pages = JSON.parse(
    JSON.stringify(I18N_CONFIG.pages, (key, value) =>
      typeof value === "string" && value.length > 1
        ? value.replace(/\/$/g, "")
        : value,
    ),
  );
}

const defaultConfig = {
  trailingSlash: false,
  assetPrefix: "",
  plugins: [],
  output: "server",
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

const { NODE_ENV } = process.env;

const SCRIPT_404 = `<script>(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.replace(u.toString())})()</script>`;

const constants = {
  PAGE_404,
  PAGE_500,
  RESERVED_PAGES: [PAGE_404, PAGE_500],
  IS_PRODUCTION:
    process.argv.some((t) => t === "PROD") || NODE_ENV === "production",
  IS_DEVELOPMENT:
    process.argv.some((t) => t === "DEV") || NODE_ENV === "development",
  PORT: parseInt(process.argv[2]) || 0,
  BUILD_DIR: buildDir,
  ROOT_DIR: rootDir,
  SRC_DIR: srcDir,
  ASSETS_DIR: path.join(buildDir, "public"),
  PAGES_DIR: path.join(buildDir, "pages"),
  I18N_CONFIG,
  LOG_PREFIX: {
    WAIT: cyanLog("[ wait ]") + " ",
    READY: greenLog("[ ready ] ") + " ",
    INFO: blueLog("[ info ] ") + " ",
    ERROR: redLog("[ error ] ") + " ",
    WARN: yellowLog("[ warn ] ") + " ",
    TICK: greenLog("✓ ") + " ",
  },
  LOCALES_SET: new Set(I18N_CONFIG?.locales || []) as Set<string>,
  CONFIG: { ...defaultConfig, ...CONFIG } as Configuration,
  IS_STATIC_EXPORT: staticExportOutputOption.has(CONFIG?.output),
  REGEX: {
    CATCH_ALL: /\[\[\.{3}.*?\]\]/g,
    DYNAMIC: /\[.*?\]/g,
    REST_DYNAMIC: /\[\.{3}.*?\]/g,
    WEB_COMPONENTS_ISLAND: /.*\/src\/web-components\/.*\.(tsx|jsx|js|ts)$/,
  },
  SCRIPT_404,
  BOOLEANS_IN_HTML,
};

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
  var BrisaRegistry: Map<string, number>;
  var lastContextProviderId: number;
}

export default constants;
