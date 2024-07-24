import { join } from 'node:path';
import fs from 'node:fs';
import { getConstants } from '@/constants';
import { transformToWebComponents } from '@/utils/get-client-code-in-page';
import getWebComponentsList from '@/utils/get-web-components-list';
import getImportableFilepath from '@/utils/get-importable-filepath';

export default async function runWebComponents() {
  const { LOG_PREFIX, SRC_DIR, BUILD_DIR } = getConstants();
  const webComponentsDir = join(SRC_DIR, 'web-components');
  const internalBrisaFolder = join(BUILD_DIR, '_brisa');
  const integrationsPath = getImportableFilepath('_integrations', webComponentsDir);
  const allWebComponents = await getWebComponentsList(SRC_DIR, integrationsPath);

  if (Object.keys(allWebComponents).length === 0) return;

  console.log(LOG_PREFIX.INFO, 'transforming JSX to web components...');

  const time = Date.now();

  if (!fs.existsSync(internalBrisaFolder)) {
    fs.mkdirSync(internalBrisaFolder, { recursive: true });
  }

  const res = await transformToWebComponents({
    pagePath: '__tests__',
    webComponentsList: allWebComponents,
    integrationsPath,
    useContextProvider: true,
  });

  if (res) eval(res.code);
  if (res?.useI18n) {
    window.i18n = {};
  }

  console.log(LOG_PREFIX.READY, `transformed in ${Date.now() - time}ms`);
}
