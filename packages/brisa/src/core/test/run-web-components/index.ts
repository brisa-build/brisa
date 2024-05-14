import { join } from "node:path";
import fs from "node:fs";
import constants from "@/constants";
import { transformToWebComponents } from "@/utils/get-client-code-in-page";
import getWebComponentsList from "@/utils/get-web-components-list";
import getImportableFilepath from "@/utils/get-importable-filepath";

// TODO: add test about this
// TODO: not log and early return if there is no web components (test it)
export default async function runWebComponents({
  SRC_DIR,
  BUILD_DIR,
  LOG_PREFIX,
}: typeof constants) {
  console.log(LOG_PREFIX.INFO, "transforming JSX to web components...");

  const time = Date.now();
  const webComponentsDir = join(SRC_DIR, "web-components");
  const internalBrisaFolder = join(BUILD_DIR, "_brisa");

  if (!fs.existsSync(internalBrisaFolder)) {
    fs.mkdirSync(internalBrisaFolder, { recursive: true });
  }

  const integrationsPath = getImportableFilepath(
    "_integrations",
    webComponentsDir,
  );
  const allWebComponents = await getWebComponentsList(
    SRC_DIR,
    integrationsPath,
  );
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
}
