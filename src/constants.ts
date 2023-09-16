import path from "node:path";
import getRootDir from "./utils/get-root-dir";
import importFileIfExists from "./utils/import-file-if-exists";

const rootDir = getRootDir();
const PAGE_404 = "/_404";
const PAGE_500 = "/_500";

const constants = {
  PAGE_404,
  PAGE_500,
  RESERVED_PAGES: [PAGE_404, PAGE_500],
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  PORT: parseInt(process.argv[2]) || 3000,
  ROOT_DIR: rootDir,
  ASSETS_DIR: path.join(rootDir, "public"),
  PAGES_DIR: path.join(rootDir, "pages"),
  I18N_CONFIG: await importFileIfExists("i18n"),
}

/**
 * TODO: Remove this function and use directly the constants when Bun supports mock modules.
 * 
 * 🚨 This is a workaround meanwhile Bun doesn't support mock modules. After that, we can 
 * refactor to use directly the constants without the need of this function and replace 
 * it in all the codebase and implement the mock modules in the tests. 
 */
export default function getConstants() {
  if (globalThis.mockConstants) return globalThis.mockConstants as typeof constants;
  return constants
}

declare global {
  var mockConstants: Partial<typeof constants> | undefined;
}
