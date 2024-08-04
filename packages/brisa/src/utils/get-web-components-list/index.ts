import fs from 'node:fs';
import path from 'node:path';
import { logError } from '@/utils/log/log-build';
import {
  ALTERNATIVE_PREFIX,
  NATIVE_FOLDER,
} from '@/utils/client-build-plugin/constants';
import isTestFile from '@/utils/is-test-file';
import { getEntrypointsRouter } from '@/utils/get-entrypoints';

const CONTEXT_PROVIDER = 'context-provider';

export default async function getWebComponentsList(
  dir: string,
  integrationsPath?: string | null,
  separator = path.sep,
): Promise<Record<string, string>> {
  const webDir = path.join(dir, 'web-components');

  if (!fs.existsSync(webDir)) return {};

  const webRouter = getEntrypointsRouter(webDir);
  const existingSelectors = new Set<string>();
  const entries = Object.entries(webRouter.routes);

  if (integrationsPath) {
    entries.push(
      ...(await Promise.all(
        Object.entries<string>(
          await import(integrationsPath).then((m) => m.default ?? {}),
        ).map(async ([key, value]) => {
          const libPath = import.meta.resolveSync(value, integrationsPath);
          const hasDefaultExport = (await Bun.file(libPath).text()).includes(
            'export default',
          );

          return [
            key,
            hasDefaultExport ? libPath : `import:${libPath}`,
          ] satisfies [string, string];
        }),
      )),
    );
  }

  const result = Object.fromEntries(
    entries
      .filter(
        ([key]) =>
          !(key.includes(ALTERNATIVE_PREFIX) || isTestFile(key)) ||
          key.includes(NATIVE_FOLDER),
      )
      .map(([key, path]) => {
        const selector = key.replace(/^\/(_)?/g, '').replaceAll('/', '-');
        const fixedPath = path.replaceAll('/', separator);

        if (selector === CONTEXT_PROVIDER) {
          logError({
            messages: [
              `You can't use the reserved name "${CONTEXT_PROVIDER}"`,
              'Please, rename it to avoid conflicts.',
            ],
            docTitle: `Documentation about ${CONTEXT_PROVIDER}`,
            docLink:
              'https://brisa.build/api-reference/components/context-provider',
          });
        } else if (existingSelectors.has(selector)) {
          logError({
            messages: [
              `You have more than one web-component with the same name: "${selector}"`,
              'Please, rename one of them to avoid conflicts.',
            ],
            docTitle: 'Documentation about web-components',
            docLink:
              'https://brisa.build/building-your-application/components-details/web-components',
          });
        } else {
          existingSelectors.add(selector);
        }

        return [selector, fixedPath];
      }),
  );

  return result;
}
