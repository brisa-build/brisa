import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import path from 'node:path';

import type { MatchedBrisaRoute, Translate } from '@/types';
import extendRequestContext from '@/utils/extend-request-context';
import responseRenderedPage, { routeToPrerenderedPagePath } from '.';
import { getConstants } from '@/constants';
import { Initiator } from '@/public-constants';

const BUILD_DIR = path.join(import.meta.dir, '..', '..', '__fixtures__');
const PAGES_DIR = path.join(BUILD_DIR, 'pages');
const ASSETS_DIR = path.join(BUILD_DIR, 'public');

describe('utils', () => {
  beforeEach(async () => {
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
    globalThis.mockConstants = undefined;
  });

  describe('response-rendered-page', () => {
    it('should return 200 page with client page code', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(
          'http://localhost:1234/es/page-with-web-component',
        ),
        i18n: {
          locale: 'es',
          defaultLocale: 'es',
          locales: ['es', 'en'],
          pages: {},
          t: ((key: string) => key) as Translate,
          overrideMessages: () => {},
        },
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, 'page-with-web-component.tsx'),
        } as MatchedBrisaRoute,
        headers: {
          'X-Mode': 'reactivity',
        },
      });

      const html = await getTextFromResponse(response);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Mode')).toBe('reactivity');
      expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
      expect(html).toContain('<web-component></web-component>');
    });

    it('should return 200 page with client page code from prerendered page', async () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost:1234/foo'),
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, 'foo.tsx'),
          pathname: '/foo',
        } as MatchedBrisaRoute,
        headers: {
          'X-Mode': 'reactivity',
        },
      });
      const html = await getTextFromResponse(response);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Mode')).toBe('reactivity');
      expect(html).toContain('<h1>Prerendered page</h1>');
    });

    it('should return 200 page with client page code from prerendered page with trailingSlash', async () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        CONFIG: {
          trailingSlash: true,
        },
      };

      const req = extendRequestContext({
        originalRequest: new Request('http://localhost:1234/foo/'),
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, 'foo.tsx'),
          pathname: '/foo/',
        } as MatchedBrisaRoute,
        headers: {
          'X-Mode': 'reactivity',
        },
      });
      const html = await getTextFromResponse(response);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Mode')).toBe('reactivity');
      expect(html).toContain('<h1>Prerendered page with trailing slash</h1>');
    });

    it('should return 200 page with client page code from prerendered page with i18n', async () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost:1234/es/foo'),
        i18n: {
          locale: 'es',
          defaultLocale: 'es',
          locales: ['es', 'en'],
          pages: {},
          t: ((key: string) => key) as Translate,
          overrideMessages: () => {},
        },
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, 'foo.tsx'),
          pathname: '/foo',
        } as MatchedBrisaRoute,
        headers: {
          'X-Mode': 'reactivity',
        },
      });

      const html = await getTextFromResponse(response);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Mode')).toBe('reactivity');
      expect(html).toContain('<h1>Prerendered page</h1>');
    });

    it('should return 200 page with client page code from prerendered page with i18n and trailingSlash', async () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        CONFIG: {
          trailingSlash: true,
        },
      };
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost:1234/es/foo/'),
        i18n: {
          locale: 'es',
          defaultLocale: 'es',
          locales: ['es', 'en'],
          pages: {},
          t: ((key: string) => key) as Translate,
          overrideMessages: () => {},
        },
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, 'foo.tsx'),
          pathname: '/foo/',
        } as MatchedBrisaRoute,
        headers: {
          'X-Mode': 'reactivity',
        },
      });

      const html = await getTextFromResponse(response);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Mode')).toBe('reactivity');
      expect(html).toContain('<h1>Prerendered page with trailing slash</h1>');
    });

    it('should return a page with layout and i18n', async () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost:1234/es/somepage'),
        i18n: {
          locale: 'es',
          defaultLocale: 'es',
          locales: ['es', 'en'],
          pages: {},
          t: ((key: string) => key) as Translate,
          overrideMessages: () => {},
        },
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, 'somepage.tsx'),
        } as MatchedBrisaRoute,
      });

      const html = await getTextFromResponse(response);

      expect(response.status).toBe(200);
      expect(html).toStartWith('<!DOCTYPE html>');
      expect(html).toContain('<html lang="es" dir="ltr">');
      expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
      expect(html).toContain('<h1>Some page</h1>');
    });

    it('should return the response headers from SYNC "responseHeaders" method of /somepage', async () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost:1234/es/somepage'),
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, 'somepage.tsx'),
        } as MatchedBrisaRoute,
      });

      expect(response.headers.get('X-Test')).toBe('test');
    });

    it('should return the response headers from ASYNC "responseHeaders" method of home', async () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost:1234/es'),
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, 'index.tsx'),
        } as MatchedBrisaRoute,
      });

      expect(response.headers.get('X-Test')).toBe('success');
    });

    it('should transfer the store from client to server and server to client', async () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost:1234/es', {
          method: 'POST',
          body: JSON.stringify({
            'x-s': [['key', 'value']],
          }),
        }),
      });
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, 'index.tsx'),
        } as MatchedBrisaRoute,
      });

      expect(await response.text()).toContain('window._S=[["key","value"]]');
    });

    it('should NOT transfer the store when is already transferred for the server action (POST)', async () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost:1234/es', {
          method: 'POST',
          body: JSON.stringify({
            'x-s': [['key', 'value']],
          }),
        }),
      });
      req.initiator = Initiator.SERVER_ACTION;
      const response = await responseRenderedPage({
        req,
        route: {
          filePath: path.join(PAGES_DIR, 'index.tsx'),
        } as MatchedBrisaRoute,
      });

      expect(await response.text()).not.toContain(
        'window._S=[["key","value"]]',
      );
    });
  });

  describe('routeToPrerenderedPagePath', () => {
    it('should work for the home', () => {
      const route = {
        pathname: '/',
      } as MatchedBrisaRoute;
      const pagePath = routeToPrerenderedPagePath(route);

      expect(pagePath).toBe(
        path.join(BUILD_DIR, 'prerendered-pages', 'index.html'),
      );
    });

    it('should work for the home with trailingSlash', () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        CONFIG: {
          trailingSlash: true,
        },
      };
      const route = {
        pathname: '/',
      } as MatchedBrisaRoute;
      const pagePath = routeToPrerenderedPagePath(route);

      expect(pagePath).toBe(
        path.join(BUILD_DIR, 'prerendered-pages', 'index.html'),
      );
    });

    it('should return the path to the prerendered page', () => {
      const route = {
        pathname: '/foo',
      } as MatchedBrisaRoute;
      const pagePath = routeToPrerenderedPagePath(route);

      expect(pagePath).toBe(
        path.join(BUILD_DIR, 'prerendered-pages', 'foo.html'),
      );
    });

    it('should return the path to the prerendered page with trailingSlash', () => {
      globalThis.mockConstants = {
        ...globalThis.mockConstants,
        CONFIG: {
          trailingSlash: true,
        },
      };
      const route = {
        pathname: '/foo/',
      } as MatchedBrisaRoute;
      const pagePath = routeToPrerenderedPagePath(route);

      expect(pagePath).toBe(
        path.join(BUILD_DIR, 'prerendered-pages', 'foo', 'index.html'),
      );
    });
  });
});

async function getTextFromResponse(response: Response) {
  try {
    const text = await response.text();
    if (text.startsWith('\u0000') || text.includes(',')) {
      const byteArray = new Uint8Array(text.split(',').map(Number));
      return new TextDecoder('utf-8').decode(byteArray);
    }
    return text;
  } catch {
    const buffer = await response.arrayBuffer();
    return new TextDecoder('utf-8').decode(buffer);
  }
}
