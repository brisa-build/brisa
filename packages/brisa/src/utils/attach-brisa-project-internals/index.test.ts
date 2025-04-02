import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { join } from 'node:path';
import { normalizeHTML } from '@/helpers';
import { getConstants } from '@/constants';
import attachBrisaProjectInternalsPlugin from '.';

const BUILD_DIR = join(import.meta.dirname, '..', '..', '__fixtures__');
const PAGES_DIR = join(BUILD_DIR, 'pages');
const DIR = join(import.meta.dirname, 'index.ts');

// Pages
const pagesPath = [
  ['/', join(PAGES_DIR, 'index.tsx')],
  ['/empty', join(PAGES_DIR, 'empty.tsx')],
  ['/foo', join(PAGES_DIR, 'foo.tsx')],
  ['/page-with-web-component', join(PAGES_DIR, 'page-with-web-component.tsx')],
  ['/somepage', join(PAGES_DIR, 'somepage.tsx')],
  ['/somepage-with-context', join(PAGES_DIR, 'somepage-with-context.tsx')],
  ['/user/[username]', join(PAGES_DIR, 'user', '[username].tsx')],
  ['/_404', join(PAGES_DIR, '_404.tsx')],
  ['/_500', join(PAGES_DIR, '_500.tsx')],
];

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
      ${pagesPath.map(([name, route], i) => `import * as p${i + 1} from "${route}";`).join('\n')}

      const allPages = {};
      ${pagesPath.map(([name, route], i) => `allPages["${name}"] = p${i + 1};`).join('\n')}
      export const pages = allPages;

      export * as middleware from '${BUILD_DIR}/middleware.ts';
      export * as i18n from '${BUILD_DIR}/i18n.ts';
      export * as config from '${BUILD_DIR}/brisa.config.ts';
      export * as integrations from '${BUILD_DIR}/web-components/_integrations.tsx';
      export * as layoutModule from '${BUILD_DIR}/layout.tsx';
      export * as websocket from '${BUILD_DIR}/websocket.ts';
    `),
    );
  });
});
