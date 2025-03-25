import { beforeEach, describe, expect, it, mock } from 'bun:test';
import path from 'node:path';
import { normalizeHTML } from '@/helpers';
import { getConstants } from '@/constants';
import attachBrisaProjectInternalsPlugin from '.';

const BUILD_DIR = path.join(import.meta.dir, '..', '..', '__fixtures__');

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

    plugin.setup({ onLoad } as any);

    const [filter, pluginFn] = onLoad.mock.calls[0] as any;
    const pluginContent = pluginFn({ loader: 'ts' });

    expect(filter).toEqual({ filter: /brisa-project-internals/ });
    expect(normalizeHTML(pluginContent.contents)).toBe(
      normalizeHTML(`
      export { default as middleware } from '${BUILD_DIR}/middleware.ts';
      export { default as i18n } from '${BUILD_DIR}/i18n.ts';
      export { default as config } from '${BUILD_DIR}/brisa.config.ts';
      export { default as integrations } from '${BUILD_DIR}/web-components/_integrations.tsx';
    `),
    );
  });
});
