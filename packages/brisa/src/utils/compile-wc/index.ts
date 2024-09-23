import clientBuildPlugin from '../client-build-plugin';

/**
 * This function is very similar to clientBuildPlugin, with the difference that
 * during build time is removed all the server dependencies to be feasible to
 * run in the browser. (clientBuildPlugin is the internal function used by Brisa)
 *
 * Docs: https:/brisa.build/api-reference/compiler-apis/compileWC
 */
export default function compileWC(code: string) {
  return clientBuildPlugin(code, 'web-component.tsx').code;
}
