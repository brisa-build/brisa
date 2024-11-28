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

/**
 * Generates the complete entry point code for client-side rendering.
 * This includes imports, Web Components registration, development-only
 * debugging tools, and optional context provider support.
 */
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

  // Note: window._P should be in the first line, in this way, the imports
  // can use this variable
  let code = useWebContextPlugins
    ? `window._P=webContextPlugins;\n${imports}`
    : `${imports}\n`;

  const wcSelectors = getWebComponentSelectors(entries, {
    useContextProvider,
    isDevelopment: IS_DEVELOPMENT,
  });

  if (useContextProvider) {
    code += injectClientContextProviderCode();
  }

  if (IS_DEVELOPMENT) {
    code += await injectDevelopmentCode();
  }

  code += defineElements(wcSelectors);

  return { code, useWebContextPlugins };
}

/**
 * Generates import statements for Web Components and optional integrations.
 * Also determines if web context plugins are present in the integration module.
 */
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

/**
 * Generates the list of Web Component selectors to define.
 * Includes internal components like context provider and error dialog.
 */
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

/**
 * Generates the JavaScript code to define all Web Components.
 * Uses the `defineElement` function to register each Web Component
 * only if it is not already defined in the custom elements registry.
 */
function defineElements(selectors: string[]): string {
  const defineElementCode =
    'const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);';
  const definitions = selectors
    .map((key) => `defineElement("${key}", ${snakeToCamelCase(key)});`)
    .join('\n');

  return `${defineElementCode}\n${definitions}`;
}

/**
 * Injects development-only debugging tools like the brisa-error-dialog.
 * This code is only included when running in development mode.
 */
async function injectDevelopmentCode(): Promise<string> {
  return (await injectBrisaDialogErrorCode()).replace(
    '__FILTER_DEV_RUNTIME_ERRORS__',
    getFilterDevRuntimeErrors(),
  );
}
