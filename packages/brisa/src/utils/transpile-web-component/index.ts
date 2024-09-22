import clientBuildPlugin from '../client-build-plugin';

/**
 * This function is very similar to clientBuildPlugin, with the difference that
 * clientBuildPlugin is used internally and returns more things than just
 * transpiling.
 *
 * Instead, this function only transpiles the code of a web component to be used
 * in the browser.
 */
export default function transpileWebComponent(code: string) {
  return clientBuildPlugin(code, 'web-component.tsx').code;
}
