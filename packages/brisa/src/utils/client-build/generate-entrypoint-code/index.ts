import { sep } from 'node:path';
import { getFilterDevRuntimeErrors } from '@/utils/brisa-error-dialog/utils';
import { getConstants } from '@/constants';
import { normalizePath } from '../normalize-path';
import snakeToCamelCase from '@/utils/snake-to-camelcase';
import { injectClientContextProviderCode } from '@/utils/context-provider/inject-client' with {
  type: 'macro',
};
import { injectBrisaDialogErrorCode } from '@/utils/brisa-error-dialog/inject-code' with {
  type: 'macro',
};

type EntrypointOptions = {
  webComponentsList: Record<string, string>;
  useContextProvider: boolean;
  integrationsPath?: string | null;
};

export async function generateEntryPointCode({
  webComponentsList,
  useContextProvider,
  integrationsPath,
}: EntrypointOptions) {
  const { IS_DEVELOPMENT } = getConstants();
  const entries = Object.entries(webComponentsList);

  if (!useContextProvider && entries.length === 0) {
    return { code: '', useWebContextPlugins: false };
  }

  const { imports, useWebContextPlugins } = await getImports(
    entries,
    integrationsPath,
  );

  const pluginsGlobal = useWebContextPlugins
    ? 'window._P=webContextPlugins;\n'
    : '';

  const wcSelectors = getWebComponentSelectors(entries, {
    useContextProvider,
    isDevelopment: IS_DEVELOPMENT,
  });

  let code = `${imports}\n`;

  if (useContextProvider) {
    code += injectClientContextProviderCode();
  }

  if (IS_DEVELOPMENT) {
    code += await injectDevelopmentCode();
  }

  code += `${pluginsGlobal}\n${defineElements(wcSelectors)}`;

  return { code, useWebContextPlugins };
}

async function getImports(
  entries: [string, string][],
  integrationsPath?: string | null,
) {
  const imports = entries.map(([name, path]) =>
    path[0] === '{'
      ? `require("${normalizePath(path)}");`
      : `import ${snakeToCamelCase(name)} from "${path.replaceAll(sep, '/')}";`,
  );

  if (integrationsPath) {
    const module = await import(integrationsPath);
    if (module.webContextPlugins?.length > 0) {
      imports.push(`import {webContextPlugins} from "${integrationsPath}";`);
      return { imports: imports.join('\n'), useWebContextPlugins: true };
    }
  }

  return { imports: imports.join('\n'), useWebContextPlugins: false };
}

function getWebComponentSelectors(
  entries: [string, string][],
  {
    useContextProvider,
    isDevelopment,
  }: { useContextProvider: boolean; isDevelopment: boolean },
) {
  const customElementKeys = entries
    .filter(([_, path]) => path[0] !== '{')
    .map(([key]) => key);

  if (useContextProvider) {
    customElementKeys.unshift('context-provider');
  }
  if (isDevelopment) {
    customElementKeys.unshift('brisa-error-dialog');
  }

  return customElementKeys;
}

function defineElements(selectors: string[]): string {
  const defineElementCode =
    'const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);';
  const definitions = selectors
    .map((key) => `defineElement("${key}", ${snakeToCamelCase(key)});`)
    .join('\n');

  return `${defineElementCode}\n${definitions}`;
}

async function injectDevelopmentCode(): Promise<string> {
  return (await injectBrisaDialogErrorCode()).replace(
    '__FILTER_DEV_RUNTIME_ERRORS__',
    getFilterDevRuntimeErrors(),
  );
}
