import { beforeEach, describe, expect, it, mock } from 'bun:test';
import path from 'node:path';
import { getConstants } from '@/constants';
import attachBrisaProjectInternalsPlugin from '.';

const BUILD_DIR = path.join(import.meta.dir, '..', '..', '__fixtures__');

describe('attach-brisa-project-internals', () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      BUILD_DIR,
    };
  });

  it('should export the middleware', () => {
    const plugin = attachBrisaProjectInternalsPlugin();
    const onLoad = mock(() => {});

    plugin.setup({ onLoad } as any);

    const [filter, pluginFn] = onLoad.mock.calls[0] as any;

    expect(filter).toEqual({ filter: /brisa-project-internals/ });
    expect(pluginFn({ loader: 'ts' })).toEqual({
      contents: `export { default as middleware } from '${BUILD_DIR}/middleware.ts';`,
      loader: 'ts',
    });
  });
});
