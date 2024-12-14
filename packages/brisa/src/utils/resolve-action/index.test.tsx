import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import path from 'node:path';

import extendRequestContext from '@/utils/extend-request-context';
import { PREFIX_MESSAGE, SUFFIX_MESSAGE } from '../rerender-in-action';
import { getConstants } from '@/constants';
import resolveAction from '.';
import SSRWebComponent, {
  AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL,
} from '@/utils/ssr-web-component';
import { normalizeHTML } from '@/helpers';

const BUILD_DIR = path.join(import.meta.dir, '..', '..', '__fixtures__');
const PAGES_DIR = path.join(BUILD_DIR, 'pages');
const ASSETS_DIR = path.join(BUILD_DIR, 'public');
let mockLog: ReturnType<typeof spyOn>;

const getReq = (url = 'http://localhost', ...params: any) =>
  extendRequestContext({
    originalRequest: new Request(url, {
      method: 'POST',
      headers: {
        'x-action': 'some-action',
      },
    }),
    store: undefined,
    ...params,
  });

describe('utils', () => {
  describe('resolve-action', () => {
    beforeEach(async () => {
      mockLog = spyOn(console, 'log');
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        PAGES_DIR,
        BUILD_DIR,
        SRC_DIR: BUILD_DIR,
        ASSETS_DIR,
        LOCALES_SET: new Set(['en', 'es']),
        I18N_CONFIG: {
          locales: ['en', 'es'],
          defaultLocale: 'es',
        },
      };
    });

    afterEach(() => {
      mockLog.mockRestore();
      globalThis.mockConstants = undefined;
    });

    it('should return a response with NotFoundError redirect', async () => {
      const error = new Error('Not found');
      error.name = 'NotFoundError';

      const req = getReq();
      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(await response.headers.get('X-Navigate')).toBe(
        'http://localhost/?_not-found=1',
      );
    });

    it('should redirect to an specific url with reactivity mode', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        I18N_CONFIG: undefined,
      };
      const navigationTrowable = new Error('/some-url');
      navigationTrowable.name = 'navigate:reactivity';

      const req = getReq();
      const response = await resolveAction({
        req,
        error: navigationTrowable,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(response.headers.get('X-Navigate')).toBe('/some-url');
      expect(response.headers.get('X-Mode')).toBe('reactivity');
    });

    it('should redirect to an specific url with transition mode', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        I18N_CONFIG: undefined,
      };
      const navigationTrowable = new Error('/some-url');
      navigationTrowable.name = 'navigate:transition';

      const req = getReq();
      const response = await resolveAction({
        req,
        error: navigationTrowable,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(response.headers.get('X-Navigate')).toBe('/some-url');
      expect(response.headers.get('X-Mode')).toBe('transition');
    });

    it('should redirect to an specific url with native mode', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        I18N_CONFIG: undefined,
      };
      const navigationTrowable = new Error('/some-url');
      navigationTrowable.name = 'navigate:native';

      const req = getReq();
      const response = await resolveAction({
        req,
        error: navigationTrowable,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(response.headers.get('X-Navigate')).toBe('/some-url');
      expect(response.headers.get('X-Mode')).toBe('native');
    });

    it('should log an error trying to rerender a invalid page', async () => {
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({ type: 'page', renderMode: 'reactivity' }) +
          SUFFIX_MESSAGE,
      );
      error.name = 'rerender';

      const req = extendRequestContext({
        originalRequest: new Request('http://localhost/invalid-page'),
      });
      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(await response.status).toBe(404);
      expect(await response.text()).toBe(
        'Error rerendering page http://localhost/invalid-page. Page route not found',
      );
    });

    it("should log an error trying to rerender a invalid page using type 'component'", async () => {
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'reactivity',
          }) +
          SUFFIX_MESSAGE,
      );
      error.name = 'rerender';

      const req = extendRequestContext({
        originalRequest: new Request('http://localhost/invalid-page'),
      });

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(await response.status).toBe(404);
      expect(await response.text()).toBe(
        'Error rerendering component on page http://localhost/invalid-page. Page route not found',
      );
    });

    it('should rerender the page with reactivity and store', async () => {
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({ type: 'page', renderMode: 'reactivity' }) +
          SUFFIX_MESSAGE,
      );
      error.name = 'rerender';

      const req = getReq();

      req.store.set('foo', 'bar');

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Mode')).toBe('reactivity');
      expect(await response.text()).toContain(
        '<!DOCTYPE html><html><head><title id="title">CUSTOM LAYOUT</title></head>',
      );
    });

    it('should rerender the page with transition', async () => {
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({ type: 'page', renderMode: 'transition' }) +
          SUFFIX_MESSAGE,
      );
      error.name = 'rerender';

      const req = getReq();
      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(await response.text()).toContain(
        '<!DOCTYPE html><html><head><title id="title">CUSTOM LAYOUT</title></head>',
      );
    });

    it('should log an error accessing to a field that does not exist in the props', async () => {
      const error = new Error('Field "foo" does not exist in props');

      const req = getReq();
      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(await response.status).toBe(500);
      expect(await response.text()).toBe('Field "foo" does not exist in props');

      const logs = mockLog.mock.calls.toString();
      expect(logs).toContain('There was an error executing the server action');
      expect(logs).toContain('Field "foo" does not exist in props');
      expect(logs).toContain(
        'Please note that for security reasons Brisa does not automatically',
      );
      expect(logs).toContain(
        'Documentation about Server actions: https://brisa.build/building-your-application/data-management/server-actions#props-in-server-actions',
      );
    });

    it('should render only the component when type is "component"', async () => {
      function Component() {
        return <div>Test</div>;
      }
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
          }) +
          SUFFIX_MESSAGE,
      );
      error.name = 'rerender';

      const req = getReq();
      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <Component />,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>Test</div>');
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('vary')).toBe('Accept-Encoding');
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(response.headers.get('X-Type')).toBe('component');
      // responseHeaders of the page:
      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should render the "component" when the originalActionId is the same as the actionId', async () => {
      const req = getReq();
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
          }) +
          SUFFIX_MESSAGE,
      );

      error.name = 'rerender';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div>Test</div>,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>Test</div>');
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('vary')).toBe('Accept-Encoding');
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(response.headers.get('X-Type')).toBe('component');
      expect(response.headers.get('X-Target')).toBe('component');
      expect(response.headers.get('X-Cid')).toBeNull();
      // responseHeaders of the page:
      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should render the "component" with X-Placement as replace as default (no placement)', async () => {
      const req = getReq();
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
          }) +
          SUFFIX_MESSAGE,
      );

      error.name = 'rerender';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div>Test</div>,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>Test</div>');
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('vary')).toBe('Accept-Encoding');
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(response.headers.get('X-Type')).toBe('component');
      expect(response.headers.get('X-Placement')).toBe('replace');
      expect(response.headers.get('X-Target')).toBe('component');
      expect(response.headers.get('X-Cid')).toBeNull();
      // responseHeaders of the page:
      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should render the "component" with X-Placement as replace', async () => {
      const req = getReq();
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
            placement: 'replace',
          }) +
          SUFFIX_MESSAGE,
      );

      error.name = 'rerender';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div>Test</div>,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>Test</div>');
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('vary')).toBe('Accept-Encoding');
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(response.headers.get('X-Type')).toBe('component');
      expect(response.headers.get('X-Placement')).toBe('replace');
      expect(response.headers.get('X-Target')).toBe('component');
      expect(response.headers.get('X-Cid')).toBeNull();
      // responseHeaders of the page:
      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should render the "component" with X-Placement as append', async () => {
      const req = getReq();
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
            placement: 'append',
          }) +
          SUFFIX_MESSAGE,
      );

      error.name = 'rerender';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div>Test</div>,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>Test</div>');
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('vary')).toBe('Accept-Encoding');
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(response.headers.get('X-Type')).toBe('component');
      expect(response.headers.get('X-Placement')).toBe('append');
      expect(response.headers.get('X-Target')).toBe('component');
      expect(response.headers.get('X-Cid')).toBeNull();
      // responseHeaders of the page:
      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should render the "component" with X-Placement as prepend', async () => {
      const req = getReq();
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
            placement: 'prepend',
          }) +
          SUFFIX_MESSAGE,
      );

      error.name = 'rerender';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div>Test</div>,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>Test</div>');
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('vary')).toBe('Accept-Encoding');
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(response.headers.get('X-Type')).toBe('component');
      expect(response.headers.get('X-Placement')).toBe('prepend');
      expect(response.headers.get('X-Target')).toBe('component');
      expect(response.headers.get('X-Cid')).toBeNull();
      // responseHeaders of the page:
      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should render the "component" with X-Placement as after', async () => {
      const req = getReq();
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
            placement: 'after',
          }) +
          SUFFIX_MESSAGE,
      );

      error.name = 'rerender';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div>Test</div>,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>Test</div>');
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('vary')).toBe('Accept-Encoding');
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(response.headers.get('X-Type')).toBe('component');
      expect(response.headers.get('X-Placement')).toBe('after');
      expect(response.headers.get('X-Target')).toBe('component');
      expect(response.headers.get('X-Cid')).toBeNull();
      // responseHeaders of the page:
      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should render the "component" with X-Placement as before', async () => {
      const req = getReq();
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
            placement: 'before',
          }) +
          SUFFIX_MESSAGE,
      );

      error.name = 'rerender';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div>Test</div>,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>Test</div>');
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('vary')).toBe('Accept-Encoding');
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(response.headers.get('X-Type')).toBe('component');
      expect(response.headers.get('X-Placement')).toBe('before');
      expect(response.headers.get('X-Target')).toBe('component');
      expect(response.headers.get('X-Cid')).toBeNull();
      // responseHeaders of the page:
      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should add X-Target with the correct target', async () => {
      const req = getReq();
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
            target: '#foo',
          }) +
          SUFFIX_MESSAGE,
      );

      error.name = 'rerender';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div>Test</div>,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>Test</div>');
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('vary')).toBe('Accept-Encoding');
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(response.headers.get('X-Type')).toBe('component');
      expect(response.headers.get('X-Target')).toBe('#foo');
      expect(response.headers.get('X-Cid')).toBeNull();
      // responseHeaders of the page:
      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should render the element with "X-Cid" when different originalActionId than actionId', async () => {
      const req = getReq();

      req.store.set(Symbol.for('DEPENDENCIES'), [
        [['onClick', 'a1_3', 'test-cid']],
      ]);
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            target: 'component',
            placement: 'replace',
            renderMode: 'transition',
          }) +
          SUFFIX_MESSAGE,
      );

      error.name = 'rerender';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_3',
        component: () => <div>Test</div>,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>Test</div>');
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('vary')).toBe('Accept-Encoding');
      expect(response.headers.get('X-Mode')).toBe('transition');
      expect(response.headers.get('X-Type')).toBe('component');
      expect(response.headers.get('X-Target')).toBe('component');
      expect(response.headers.get('X-Cid')).toBe('test-cid');
      // responseHeaders of the page:
      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should render the component with an script to transfer the store when type is "component"', async () => {
      function Component() {
        return (
          <div>
            Test{' '}
            <SSRWebComponent
              ssr-selector="some-web-component-to-transfer-store"
              ssr-Component={() => <div />}
            />
          </div>
        );
      }
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
          }) +
          SUFFIX_MESSAGE,
      );
      error.name = 'rerender';

      const req = getReq();
      req.store.set(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL, true);
      req.store.set('foo', 'bar');
      (req as any).webStore.set('foo', 'bar');

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <Component />,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe(
        normalizeHTML(`<div>
          Test <some-web-component-to-transfer-store></some-web-component-to-transfer-store>
        </div>
        <script>window._S=[["foo","bar"]];for(let [k, v] of _S) _s?.set?.(k, v)</script>`),
      );
    });

    it('should render the component using the Symbol.for("element") from the error throwable', async () => {
      function Component({ name }: { name: string }) {
        return <div>{name}</div>;
      }

      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
          }) +
          SUFFIX_MESSAGE,
      );
      error.name = 'rerender';
      // @ts-ignore
      error[Symbol.for('element')] = <Component name="John" />;

      const req = getReq();
      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        // @ts-ignore
        component: (props) => <Component {...props} />,
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<div>John</div>');
    });

    it('should re-add action dependencies to the component when type is "component"', async () => {
      const req = getReq();
      req.store.set(Symbol.for('DEPENDENCIES'), [
        [['onClick', 'a1_3', 'test-cid']],
        [['onClick', 'a1_2', 'test-cid']],
      ]);
      const error = new Error(
        PREFIX_MESSAGE +
          JSON.stringify({
            type: 'component',
            renderMode: 'transition',
          }) +
          SUFFIX_MESSAGE,
      );
      error.name = 'rerender';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: (__props: any) => (
          <div
            data-action
            data-actions="[['onClick', 'a1_3', 'test-cid']]"
            {...__props}
          >
            Test
          </div>
        ),
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe(
        `<div data-action data-actions="[['onClick', 'a1_3', 'test-cid']]" data-action-onclick="a1_1">Test</div>`,
      );
    });

    it('should navigate with the i18n locale', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        PAGES_DIR,
        BUILD_DIR,
        SRC_DIR: BUILD_DIR,
        ASSETS_DIR,
        LOCALES_SET: new Set(['en', 'es']),
        I18N_CONFIG: {
          locales: ['ru', 'es'],
          defaultLocale: 'ru',
        },
      };
      const error = new Error('/some-url');
      error.name = 'navigate:reactivity';

      const req = getReq();
      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(response.headers.get('X-Navigate')).toBe('/ru/some-url');
      expect(response.headers.get('X-Mode')).toBe('reactivity');
    });

    it('should be possible to navigate to another i18n locale + accept-language header', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        PAGES_DIR,
        BUILD_DIR,
        SRC_DIR: BUILD_DIR,
        ASSETS_DIR,
        LOCALES_SET: new Set(['en', 'es', 'ca']),
        I18N_CONFIG: {
          locales: ['en', 'es', 'ca'],
          defaultLocale: 'en',
        },
      };
      const error = new Error('/ca');
      error.name = 'navigate:native';

      const req = getReq('http://localhost/en');
      req.i18n = {
        defaultLocale: 'en',
        locales: ['en', 'es', 'ca'],
        locale: 'en',
        t: (v) => v,
        pages: {},
        overrideMessages: () => {},
      };
      req.headers.set(
        'accept-language',
        'en,es-ES;q=0.9,es;q=0.8,de-CH;q=0.7,de;q=0.6,pt;q=0.5',
      );
      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(response.headers.get('X-Navigate')).toBe('/ca');
      expect(response.headers.get('X-Mode')).toBe('native');
    });

    it('should navigate with trailing slash', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        CONFIG: {
          trailingSlash: true,
        },
        I18N_CONFIG: undefined,
      };

      const error = new Error('/some-url');
      const req = getReq();

      error.name = 'navigate:reactivity';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(response.headers.get('X-Navigate')).toBe('/some-url/');
    });

    it('should navigate with i18n and trailing slash', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        CONFIG: {
          trailingSlash: true,
        },
        I18N_CONFIG: {
          locales: ['ru', 'es'],
          defaultLocale: 'ru',
        },
      };

      const error = new Error('/some-url');
      const req = getReq();

      error.name = 'navigate:reactivity';

      const response = await resolveAction({
        req,
        error,
        actionId: 'a1_1',
        component: () => <div />,
      });

      expect(response.headers.get('X-Navigate')).toBe('/ru/some-url/');
    });
  });
});
