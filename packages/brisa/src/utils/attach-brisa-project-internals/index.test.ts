import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { join } from 'node:path';
import { normalizeHTML } from '@/helpers';
import { getConstants } from '@/constants';
import attachBrisaProjectInternalsPlugin from '.';

const BUILD_DIR = join(import.meta.dirname, '..', '..', '__fixtures__');
const API_DIR = join(BUILD_DIR, 'api');
const PAGES_DIR = join(BUILD_DIR, 'pages');

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

const apiEndpointsPath = [
  ['/api', join(API_DIR, 'index.ts')],
  ['/api/example', join(API_DIR, 'example.ts')],
];

describe('attach-brisa-project-internals', () => {
  it('should export all internals with default values when they does not exist', () => {
    const plugin = attachBrisaProjectInternalsPlugin();
    const onLoad = mock(() => {});
    const onResolve = mock(() => {});

    plugin.setup({ onLoad, onResolve } as any);

    const [filter, pluginFn] = onLoad.mock.calls[0] as any;
    const pluginContent = pluginFn({ loader: 'ts' });

    expect(filter).toEqual({
      filter: /.*/,
      namespace: 'brisa-project-internals',
    });
    expect(normalizeHTML(pluginContent.contents)).toBe(
      normalizeHTML(`
      const actions = null;
      const middleware = null;
      const i18n = null;
      const config = {};
      const integrations = null;
      const layoutModule = null;
      const websocket = null;
      const cssFiles = [];
      const pages = {};
      const apiEndpoints = {};

      export default function getProjectInternals() {
        return {
          actions,
          middleware,
          i18n,
          config,
          integrations,
          layoutModule,
          websocket,
          cssFiles,
          pages,
          apiEndpoints,
        }
      }
    `),
    );
  });

  it('should export all internals with static imports', () => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      BUILD_DIR,
      ROOT_DIR: BUILD_DIR,
      PAGES_DIR,
    };
    const plugin = attachBrisaProjectInternalsPlugin();
    const onLoad = mock(() => {});
    const onResolve = mock(() => {});

    plugin.setup({ onLoad, onResolve } as any);

    const [filter, pluginFn] = onLoad.mock.calls[0] as any;
    const pluginContent = pluginFn({ loader: 'ts' });

    expect(filter).toEqual({
      filter: /.*/,
      namespace: 'brisa-project-internals',
    });
    expect(normalizeHTML(pluginContent.contents)).toBe(
      normalizeHTML(`
      import * as actions from '${BUILD_DIR}/actions/index.tsx';
      import * as middleware from '${BUILD_DIR}/middleware.ts';
      import * as i18n from '${BUILD_DIR}/i18n.ts';
      import * as config from '${BUILD_DIR}/brisa.config.ts';
      import * as integrations from '${BUILD_DIR}/web-components/_integrations.tsx';
      import * as layoutModule from '${BUILD_DIR}/layout.tsx';
      import * as websocket from '${BUILD_DIR}/websocket.ts';
      import { default as cssFiles } from '${BUILD_DIR}/css-files.js';
      ${pagesPath.map(([name, route], i) => `import * as p${i + 1} from "${route}";`).join('\n')}
      ${apiEndpointsPath.map(([name, route], i) => `import * as a${i + 1} from "${route}";`).join('\n')}

      const pages = {};
      ${pagesPath.map(([name, route], i) => `pages["${name}"] = p${i + 1};`).join('\n')}

      const apiEndpoints = {};
      ${apiEndpointsPath.map(([name, route], i) => `apiEndpoints["${name}"] = a${i + 1};`).join('\n')}

      export default function getProjectInternals() {
        return {
          actions,
          middleware,
          i18n,
          config,
          integrations,
          layoutModule,
          websocket,
          cssFiles,
          pages,
          apiEndpoints,
        }
      }
    `),
    );
  });
});
