import { expect } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { join } from "node:path";
import matchers from "@/core/test/matchers";
import constants from "@/constants";
import { transformToWebComponents } from "@/utils/get-client-code-in-page";
import getWebComponentsList from "@/utils/get-web-components-list";
import getImportableFilepath from "@/utils/get-importable-filepath";

GlobalRegistrator.register();

expect.extend(matchers);

globalThis.REGISTERED_ACTIONS = [];

const { SRC_DIR, LOG_PREFIX } = constants;

console.log(LOG_PREFIX.INFO, "transforming JSX to web components...");

const time = Date.now();
const webComponentsDir = join(SRC_DIR, "web-components");
const integrationsPath = getImportableFilepath(
  "_integrations",
  webComponentsDir,
);
const allWebComponents = await getWebComponentsList(SRC_DIR, integrationsPath);
const res = await transformToWebComponents({
  pagePath: "__tests__",
  webComponentsList: allWebComponents,
  integrationsPath,
  useContextProvider: true,
});

if (res) eval(res.code);
if (res?.useI18n) {
  // TODO: Implement i18n
}

console.log(LOG_PREFIX.READY, `transformed in ${Date.now() - time}ms`);

export * from "@/core/test/api";
