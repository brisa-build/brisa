import { sep } from 'node:path';
import { getFilterDevRuntimeErrors } from '@/utils/brisa-error-dialog/utils';
import { injectClientContextProviderCode } from '@/utils/context-provider/inject-client' with {
  type: 'macro',
};
import { injectBrisaDialogErrorCode } from '@/utils/brisa-error-dialog/inject-code' with {
  type: 'macro',
};
import { getConstants } from '@/constants';
import { normalizePath } from '../normalize-path';
import snakeToCamelCase from '@/utils/snake-to-camelcase';

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

  const customElementKeys = entries
    .filter(([_, path]) => path[0] !== '{')
    .map(([key]) => key);

  addOptionalComponents(customElementKeys, useContextProvider, IS_DEVELOPMENT);

  let code = '';

  if (useContextProvider) {
    code += injectClientContextProviderCode();
  }

  if (IS_DEVELOPMENT) {
    code += await getDevelopmentCode();
  }

  if (useWebContextPlugins) {
    code += 'window._P=webContextPlugins;\n';
  }

  code += `${imports}\n${getDefineElementCode(customElementKeys)}`;

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

function getDefineElementCode(keys: string[]): string {
  const defineElementCode =
    'const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);';
  const definitions = keys
    .map((key) => `defineElement("${key}", ${snakeToCamelCase(key)});`)
    .join('\n');

  return `${defineElementCode}\n${definitions}`;
}

async function getDevelopmentCode(): Promise<string> {
  const brisaDialogErrorCode = (await injectBrisaDialogErrorCode()).replace(
    '__FILTER_DEV_RUNTIME_ERRORS__',
    getFilterDevRuntimeErrors(),
  );
  return brisaDialogErrorCode;
}

function addOptionalComponents(
  keys: string[],
  useContextProvider: boolean,
  isDevelopment: boolean,
) {
  if (useContextProvider) {
    keys.unshift('context-provider');
  }
  if (isDevelopment) {
    keys.unshift('brisa-error-dialog');
  }
}
