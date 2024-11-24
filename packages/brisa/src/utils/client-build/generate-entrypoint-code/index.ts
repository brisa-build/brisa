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

type EntrpypointOptions = {
  webComponentsList: Record<string, string>;
  useContextProvider: boolean;
  integrationsPath?: string | null;
};

export async function generateEntryPointCode({
  webComponentsList,
  useContextProvider,
  integrationsPath,
}: EntrpypointOptions) {
  const { IS_DEVELOPMENT } = getConstants();
  let useWebContextPlugins = false;
  const entries = Object.entries(webComponentsList);

  if (!useContextProvider && !entries.length) {
    return {
      code: '',
      useWebContextPlugins: false,
    };
  }

  // Note: JS imports in Windows have / instead of \, so we need to replace it
  // Note: Using "require" for component dependencies not move the execution
  // on top avoiding missing global variables as window._P (P = plugins)
  let imports = entries
    .map(([name, path]) =>
      path[0] === '{'
        ? `require("${normalizePath(path)}");`
        : `import ${snakeToCamelCase(name)} from "${path.replaceAll(sep, '/')}";`,
    )
    .join('\n');

  // Add web context plugins import only if there is a web context plugin
  if (integrationsPath) {
    const module = await import(integrationsPath);
    if (module.webContextPlugins?.length > 0) {
      useWebContextPlugins = true;
      imports += `import {webContextPlugins} from "${integrationsPath}";`;
    }
  }

  const defineElement =
    'const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);';

  const customElementKeys = entries
    .filter(([_, path]) => path[0] !== '{')
    .map(([k]) => k);

  if (useContextProvider) {
    customElementKeys.unshift('context-provider');
  }

  if (IS_DEVELOPMENT) {
    customElementKeys.unshift('brisa-error-dialog');
  }

  const customElementsDefinitions = customElementKeys
    .map((k) => `defineElement("${k}", ${snakeToCamelCase(k)});`)
    .join('\n');

  let code = '';

  if (useContextProvider) {
    const contextProviderCode =
      injectClientContextProviderCode() as unknown as string;
    code += contextProviderCode;
  }

  // IS_DEVELOPMENT to avoid PROD and TEST environments
  if (IS_DEVELOPMENT) {
    const brisaDialogErrorCode = (await injectBrisaDialogErrorCode()).replace(
      '__FILTER_DEV_RUNTIME_ERRORS__',
      getFilterDevRuntimeErrors(),
    );
    code += brisaDialogErrorCode;
  }

  // Inject web context plugins to window to be used inside web components
  if (useWebContextPlugins) {
    code += 'window._P=webContextPlugins;\n';
  }

  code += `${imports}\n`;
  code += `${defineElement}\n${customElementsDefinitions}`;

  return { code, useWebContextPlugins };
}
