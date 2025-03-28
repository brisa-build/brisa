import { beforeEach, describe, expect, it, mock } from 'bun:test';
import path from 'node:path';
import { normalizeHTML } from '@/helpers';
import { getConstants } from '@/constants';
import attachBrisaProjectInternalsPlugin from '.';

const BUILD_DIR = path.join(import.meta.dirname, '..', '..', '__fixtures__');
const DIR = path.join(import.meta.dirname, 'index.ts');

describe('attach-brisa-project-internals', () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      BUILD_DIR,
      ROOT_DIR: BUILD_DIR,
    };
  });

  it('should export the middleware & i18n', () => {
    const plugin = attachBrisaProjectInternalsPlugin();
    const onLoad = mock(() => {});
    const onResolve = mock(() => {});

    plugin.setup({ onLoad, onResolve } as any);

    const [filter, pluginFn] = onLoad.mock.calls[0] as any;
    const pluginContent = pluginFn({ loader: 'ts' });

    expect(filter).toEqual({ filter: new RegExp(DIR) });
    expect(normalizeHTML(pluginContent.contents)).toBe(
      normalizeHTML(`
      export { default as middleware } from '${BUILD_DIR}/middleware.ts';
      export { default as i18n } from '${BUILD_DIR}/i18n.ts';
      export { default as config } from '${BUILD_DIR}/brisa.config.ts';
      export { default as integrations } from '${BUILD_DIR}/web-components/_integrations.tsx';
      export * as layoutModule from '${BUILD_DIR}/layout.tsx';
    `),
    );
  });
});
