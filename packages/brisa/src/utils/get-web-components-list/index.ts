import fs from 'node:fs';
import path from 'node:path';
import { logError, logWarning } from '@/utils/log/log-build';
import {
  ALTERNATIVE_PREFIX,
  NATIVE_FOLDER,
} from '@/utils/client-build-plugin/constants';
import isTestFile from '@/utils/is-test-file';
import { getEntrypointsRouter } from '@/utils/get-entrypoints';
import resolveImportSync from '@/utils/resolve-import-sync';
import type { WebComponentIntegrations } from '@/types';

const CONTEXT_PROVIDER = 'context-provider';
const SEPS = '\\\\|/';
const SEPS_REGEX = new RegExp(`(${SEPS})+`, 'g');
const PREFIX_REGEX = new RegExp(`^(${SEPS})+(_)?`, 'g');
const EXTENSION_REGEX = /\.[^/.]+$/;

export default async function getWebComponentsList(
  dir: string,
  integrationsPath?: string | null,
): Promise<Record<string, string>> {
  const webDir = path.join(dir, 'web-components');

  if (!fs.existsSync(webDir)) return {};

  const webRouter = getEntrypointsRouter(webDir);
  const entries = webRouter.routes;

  if (integrationsPath) {
    entries.push(
      ...(await Promise.all(
        Object.entries<WebComponentIntegrations>(
          await import(integrationsPath).then((m) => m.default ?? {}),
        ).map(async ([key, value]) => {
          const warnMsg = `The selector "${key}" from _integrations file looks that is defined inside the library with a different selector name.`;
          let fixedPathname = '';

          if (typeof value === 'string') {
            const libPath = resolveImportSync(value, integrationsPath);
            const code = await Bun.file(libPath).text();
            const hasDefaultExport = code.includes('export default');

            if (!hasDefaultExport && !code.includes(key)) {
              logWarning([warnMsg]);
            }

            fixedPathname = hasDefaultExport
              ? libPath
              : JSON.stringify({ client: libPath });
          } else if (typeof value.client === 'string') {
            const obj: WebComponentIntegrations = {
              client: resolveImportSync(value.client, integrationsPath),
            };

            if (typeof value.server === 'string') {
              obj.server = resolveImportSync(value.server, integrationsPath);
            }

            if (typeof value.types === 'string') {
              obj.types = resolveImportSync(value.types, integrationsPath);
            }

            if (!(await Bun.file(obj.client as string).text()).includes(key)) {
              logWarning([warnMsg]);
            }

            fixedPathname = JSON.stringify(obj);
          }

          return [key, fixedPathname] satisfies [string, string];
        }),
      )),
    );
  }

  return routesEntriesToWebComponents(entries);
}

export function getWebComponentListFromFilePaths(
  filePaths: string[],
): Record<string, string> {
  return routesEntriesToWebComponents(
    filePaths.map((path) => {
      const filename = path.split('/').pop() ?? path;
      const route = path.split('web-components')[1] ?? filename;
      return [route.replace(EXTENSION_REGEX, ''), path];
    }),
  );
}

export function routesEntriesToWebComponents(
  entries: [string, string][],
): Record<string, string> {
  const existingSelectors = new Set<string>();

  return Object.fromEntries(
    entries
      .filter(
        ([key]) =>
          !(key.includes(ALTERNATIVE_PREFIX) || isTestFile(key)) ||
          key.includes(NATIVE_FOLDER),
      )
      .map(([key, path]) => {
        const selector = formatWCSelector(key);

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
        } else if (!selector.includes('-')) {
          logError({
            messages: [
              `You have a web component without kebab-case: "${selector}"`,
              'Please, rename it to avoid conflicts with the rest of HTML elements.',
            ],
            docTitle: 'Documentation about web-components',
            docLink:
              'https://brisa.build/building-your-application/components-details/web-components',
          });
        } else {
          existingSelectors.add(selector);
        }

        return [selector, path];
      }),
  );
}

export function formatWCSelector(key: string): string {
  return key.replace(PREFIX_REGEX, '').replace(SEPS_REGEX, '-').toLowerCase();
}
