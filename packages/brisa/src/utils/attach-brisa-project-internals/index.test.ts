import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { join } from 'node:path';
import { normalizeHTML } from '@/helpers';
import { getConstants } from '@/constants';
import attachBrisaProjectInternalsPlugin from '.';

const BUILD_DIR = join(import.meta.dirname, '..', '..', '__fixtures__');
const PAGES_DIR = join(BUILD_DIR, 'pages');
const DIR = join(import.meta.dirname, 'index.ts');

// Pages
const p1 = join(PAGES_DIR, 'index.tsx');
const p2 = join(PAGES_DIR, 'foo.tsx');
const p3 = join(PAGES_DIR, 'page-with-web-component.tsx');
const p4 = join(PAGES_DIR, 'somepage.tsx');
const p5 = join(PAGES_DIR, 'somepage-with-context.tsx');
const p6 = join(PAGES_DIR, 'user', '[username].tsx');
const p7 = join(PAGES_DIR, '_404.tsx');
const p8 = join(PAGES_DIR, '_500.tsx');

describe('attach-brisa-project-internals', () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      BUILD_DIR,
      ROOT_DIR: BUILD_DIR,
      PAGES_DIR,
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
      import * as p1 from "${p1}";
      import * as p2 from "${p2}";
      import * as p3 from "${p3}";
      import * as p4 from "${p4}";
      import * as p5 from "${p5}";
      import * as p6 from "${p6}";
      import * as p7 from "${p7}";
      import * as p8 from "${p8}";

      const allPages = {};
      allPages["${p1}"] = p1;
      allPages["${p2}"] = p2;
      allPages["${p3}"] = p3;
      allPages["${p4}"] = p4;
      allPages["${p5}"] = p5;
      allPages["${p6}"] = p6;
      allPages["${p7}"] = p7;
      allPages["${p8}"] = p8;
      export const pages = allPages;

      export * as middleware from '${BUILD_DIR}/middleware.ts';
      export { default as i18n } from '${BUILD_DIR}/i18n.ts';
      export { default as config } from '${BUILD_DIR}/brisa.config.ts';
      export * as integrations from '${BUILD_DIR}/web-components/_integrations.tsx';
      export * as layoutModule from '${BUILD_DIR}/layout.tsx';
      export * as websocket from '${BUILD_DIR}/websocket.ts';
    `),
    );
  });
});
