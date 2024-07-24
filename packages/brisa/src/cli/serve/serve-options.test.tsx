import type { BunFile } from 'bun';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
  mock,
  jest,
} from 'bun:test';
import { brotliDecompressSync } from 'node:zlib';
import path from 'node:path';
import { getConstants } from '@/constants';
import type { ServerWebSocket } from 'bun';
import type { RequestContext } from '@/types';
import { RenderInitiator } from '@/public-constants';

const BUILD_DIR = path.join(import.meta.dir, '..', '..', '__fixtures__');
const PAGES_DIR = path.join(BUILD_DIR, 'pages');
const ASSETS_DIR = path.join(BUILD_DIR, 'public');
const BASE_PATHS = ['', '/some-dir', '/es', '/some/dir'];

async function testRequest(
  request: Request,
  upgrade = false,
): Promise<Response> {
  const serveOptions = await (
    await import('./serve-options')
  ).getServeOptions();

  return (
    // @ts-ignore
    ((await serveOptions.fetch(request, {
      requestIP: () => {},
      upgrade: () => upgrade,
    })) || new Response('', { status: 101 })) as Response
  );
}

describe.each(BASE_PATHS)('CLI: serve %s', (basePath) => {
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
      CONFIG: {
        basePath,
      },
    };
  });

  afterEach(() => {
    globalThis.__BASE_PATH__ = '';
    globalThis.mockConstants = undefined;
    jest.restoreAllMocks();
  });

  it('should set the env variables when they are not set for a custom server', async () => {
    await (await import('./serve-options')).getServeOptions();

    expect(process.env.__CRYPTO_KEY__).toBeDefined();
    expect(process.env.__CRYPTO_IV__).toBeDefined();
    expect(process.env.BRISA_BUILD_FOLDER).toBe(
      path.join(process.cwd(), 'build'),
    );
  });

  it('should log an error and exit if there are no "build" directory in production', async () => {
    const constants = getConstants();
    globalThis.mockConstants = {
      ...constants,
      IS_PRODUCTION: true,
      BUILD_DIR: '/some-path',
    };
    const mockLog = spyOn(console, 'log');

    const serveOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    expect(mockLog).toHaveBeenCalledWith(
      constants.LOG_PREFIX.ERROR,
      'Not exist "build" yet. Please run "brisa build" first',
    );

    mockLog.mockRestore();

    expect(serveOptions).toBeNull();
  });

  it('should log an error and exit if there are no "pages" directory in production', async () => {
    const constants = getConstants();
    globalThis.mockConstants = {
      ...constants,
      IS_PRODUCTION: true,
      PAGES_DIR: '/some-path',
    };
    const mockLog = spyOn(console, 'log');

    const serveOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    expect(mockLog).toHaveBeenCalledWith(
      constants.LOG_PREFIX.ERROR,
      `Not exist build/pages" directory. It's required to run "brisa start"`,
    );

    mockLog.mockRestore();

    expect(serveOptions).toBeNull();
  });

  it('should log an error and exit if there are no "pages" directory in development', async () => {
    const constants = getConstants();
    globalThis.mockConstants = {
      ...constants,
      IS_PRODUCTION: false,
      PAGES_DIR: '/some-path',
    };
    const mockLog = spyOn(console, 'log');

    const serveOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    expect(mockLog).toHaveBeenCalledWith(
      constants.LOG_PREFIX.ERROR,
      `Not exist src/pages" directory. It's required to run "brisa dev"`,
    );

    mockLog.mockRestore();

    expect(serveOptions).toBeNull();
  });

  it('should no fetch anything when server upgrades to websocket', async () => {
    const upgrade = true;
    const response = await testRequest(
      new Request(`http:///localhost:1234${basePath}/somepage`),
      upgrade,
    );

    expect(response.status).toBe(101);
    expect(response.text()).resolves.toBe('');
  });

  it('should return 500 page if the middleware throws an error', async () => {
    const response = await testRequest(
      // "throws-error" parameter is managed by __fixtures__/middleware.tsx
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component?throws-error=1`,
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(500);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<title id="title">Some internal error</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      '<h1>Some internal error <web-component></web-component></h1>',
    );
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/_500.tsx"></script>`,
    );
  });

  it('should be possible to redirect to "/" in the middleware', async () => {
    const response = await testRequest(
      // "redirect" parameter is managed by __fixtures__/middleware.tsx
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component?redirect=1`,
      ),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('/es');
  });

  it('should navigate when the middleware throws a navigate error', async () => {
    const response = await testRequest(
      // "navigate" parameter is managed by __fixtures__/middleware.tsx
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component?navigate=/es/somepage`,
      ),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `http://localhost:1234${basePath}/es/somepage`,
    );
  });

  it('should navigate resolving i18n when the middleware throws a navigate error', async () => {
    const response = await testRequest(
      // "navigate" parameter is managed by __fixtures__/middleware.tsx
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component?navigate=/somepage`,
      ),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(`${basePath}/es/somepage`);
  });

  it('should navigate removing trailing slash when the middleware throws a navigate error', async () => {
    const response = await testRequest(
      // "navigate" parameter is managed by __fixtures__/middleware.tsx
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component?navigate=/es/somepage/`,
      ),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `http://localhost:1234${basePath}/es/somepage`,
    );
  });

  it('should navigate removing trailing slash and adding i18n at the same time when the middleware throws a navigate error', async () => {
    const response = await testRequest(
      // "navigate" parameter is managed by __fixtures__/middleware.tsx
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component?navigate=/somepage/`,
      ),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(`${basePath}/es/somepage`);
  });

  it('should navigate to an external url without i18n and trailing slash when the middleware throws a navigate error', async () => {
    const response = await testRequest(
      // "navigate" parameter is managed by __fixtures__/middleware.tsx
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component?navigate=https://brisa.build/foo/`,
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(
      `https://brisa.build${basePath}/foo/`,
    );
  });

  it('should return 404 page when the middleware throws a not found error', async () => {
    const response = await testRequest(
      // "throws-not-found" parameter is managed by __fixtures__/middleware.tsx
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component?throws-not-found=1`,
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      '<h1>Page not found 404 <web-component></web-component></h1>',
    );
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/_404.tsx"></script>`,
    );
  });

  it("should return 404 page without redirect to the locale if the page doesn't exist", async () => {
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}/not-found-page`),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      '<h1>Page not found 404 <web-component></web-component></h1>',
    );
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/_404.tsx"></script>`,
    );
  });

  it('should return 404 error if the 404 page does not exist and the page does not exist', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      PAGE_404: '',
    };
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}/not-found-page`),
    );
    const text = await response.text();

    expect(response.status).toBe(404);
    expect(text).toBe('Not found');
  });

  it("should return 404 page without redirect to the trailingSlash if the page doesn't exist", async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        trailingSlash: true,
      },
    };
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}/es/not-found-page`),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      '<h1>Page not found 404 <web-component></web-component></h1>',
    );
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/_404.tsx"></script>`,
    );
  });

  it("should return 404 page without redirect to the locale and trailingSlash if the page doesn't exist", async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        trailingSlash: true,
      },
    };
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}/not-found-page`),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      '<h1>Page not found 404 <web-component></web-component></h1>',
    );
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/_404.tsx"></script>`,
    );
  });

  it('should return 404 page', async () => {
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}/es/not-found-page`),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      '<h1>Page not found 404 <web-component></web-component></h1>',
    );
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/_404.tsx"></script>`,
    );
  });

  it('should return 404 page with a valid url but with the param _not-found in the query string', async () => {
    const response = await testRequest(
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component?_not-found=1`,
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      '<h1>Page not found 404 <web-component></web-component></h1>',
    );
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/_404.tsx"></script>`,
    );
  });

  it('should return 200 page with client page code', async () => {
    const response = await testRequest(
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component`,
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/page-with-web-component.tsx"></script>`,
    );
    expect(html).toContain('<web-component></web-component>');
  });

  it('should return 200 page with client page code using a hash', async () => {
    const response = await testRequest(
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component#hash`,
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/page-with-web-component.tsx"></script>`,
    );
    expect(html).toContain('<web-component></web-component>');
  });

  it('should return 200 page with client page code using a hash and trailingSlash', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        trailingSlash: true,
      },
    };
    const response = await testRequest(
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component/#hash`,
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/page-with-web-component.tsx"></script>`,
    );
    expect(html).toContain('<web-component></web-component>');
  });

  it('should return 404 page with client page code without the basePath', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        basePath: '/incorrect',
      },
    };
    const response = await testRequest(
      new Request(
        `http://localhost:1234${basePath}/es/page-with-web-component`,
      ),
    );
    expect(response.status).toBe(404);
  });

  it('should redirect the home to the correct locale', async () => {
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}`),
    );
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(`${basePath}/es`);
  });

  it('should redirect the home to the correct locale and trailingSlash', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        trailingSlash: true,
      },
    };
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}/`),
    );
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(`${basePath}/es/`);
  });

  it('should redirect to the correct locale', async () => {
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}/somepage`),
    );
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(`${basePath}/es/somepage`);
  });

  it('should redirect to the correct browser locale', async () => {
    const req = new Request(`http://localhost:1234${basePath}/somepage`);

    req.headers.set('Accept-Language', 'en-US,en;q=0.5');

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(`${basePath}/en/somepage`);
  });

  it('should redirect to the correct default locale of the subdomain', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      I18N_CONFIG: {
        locales: ['en', 'es'],
        defaultLocale: 'es',
        domains: {
          'en.test.com': {
            defaultLocale: 'en',
            protocol: 'https',
          },
          'es.test.com': {
            defaultLocale: 'es',
            protocol: 'http',
          },
        },
      },
    };

    const response = await testRequest(
      new Request(`https://en.test.com${basePath}/somepage`),
    );

    const responseEs = await testRequest(
      new Request(`https://es.test.com${basePath}/somepage`),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `https://en.test.com${basePath}/en/somepage`,
    );
    expect(responseEs.status).toBe(301);
    expect(responseEs.headers.get('Location')).toBe(
      `http://es.test.com${basePath}/es/somepage`,
    );
  });

  it('should redirect to the correct browser locale changing the subdomain', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      I18N_CONFIG: {
        locales: ['en', 'es'],
        defaultLocale: 'es',
        domains: {
          'en.test.com': {
            defaultLocale: 'en',
          },
          'es.test.com': {
            defaultLocale: 'es',
          },
        },
      },
    };

    const req = new Request(`https://es.test.com${basePath}/somepage`);

    req.headers.set('Accept-Language', 'en-US,en;q=0.5');

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `https://en.test.com${basePath}/en/somepage`,
    );
  });

  it('should redirect to the correct browser locale changing the subdomain and the page route name', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      I18N_CONFIG: {
        locales: ['en', 'es'],
        defaultLocale: 'es',
        domains: {
          'en.test.com': {
            defaultLocale: 'en',
          },
          'es.test.com': {
            defaultLocale: 'es',
          },
        },
        pages: {
          '/somepage': {
            en: '/somepage-en',
          },
        },
      },
    };

    const req = new Request(`https://es.test.com${basePath}/somepage`);

    req.headers.set('Accept-Language', 'en-US,en;q=0.5');

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `https://en.test.com${basePath}/en/somepage-en`,
    );
  });

  it('should redirect to the correct browser locale changing the subdomain and the page route name with hash', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      I18N_CONFIG: {
        locales: ['en', 'es'],
        defaultLocale: 'es',
        domains: {
          'en.test.com': {
            defaultLocale: 'en',
          },
          'es.test.com': {
            defaultLocale: 'es',
          },
        },
        pages: {
          '/somepage': {
            en: '/somepage-en',
          },
        },
      },
    };

    const req = new Request(`https://es.test.com${basePath}/somepage#hash`);

    req.headers.set('Accept-Language', 'en-US,en;q=0.5');

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `https://en.test.com${basePath}/en/somepage-en#hash`,
    );
  });

  it('should redirect to the correct browser locale changing the subdomain, adding trailing slash and translating the route name', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        trailingSlash: true,
      },
      I18N_CONFIG: {
        locales: ['en', 'es'],
        defaultLocale: 'es',
        domains: {
          'en.test.com': {
            defaultLocale: 'en',
          },
          'es.test.com': {
            defaultLocale: 'es',
          },
        },
        pages: {
          '/somepage': {
            en: '/somepage-en',
          },
        },
      },
    };

    const req = new Request(`https://es.test.com${basePath}/somepage`);

    req.headers.set('Accept-Language', 'en-US,en;q=0.5');

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `https://en.test.com${basePath}/en/somepage-en/`,
    );
  });

  it('should redirect to the correct browser locale without changing the subdomain in development', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: false,
      I18N_CONFIG: {
        locales: ['en', 'es'],
        defaultLocale: 'es',
        domains: {
          'en.test.com': {
            defaultLocale: 'en',
          },
          'es.test.com': {
            defaultLocale: 'es',
          },
        },
      },
    };

    const req = new Request(`http://localhost:1234${basePath}/somepage`);

    req.headers.set('Accept-Language', 'en-US,en;q=0.5');

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(`${basePath}/en/somepage`);
  });

  it('should redirect to the correct browser locale and changing the subdomain in development', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: false,
      I18N_CONFIG: {
        locales: ['en', 'es'],
        defaultLocale: 'es',
        domains: {
          'en.test.com': {
            defaultLocale: 'en',
            dev: true,
          },
          'es.test.com': {
            defaultLocale: 'es',
            dev: true,
          },
        },
      },
    };

    const req = new Request(`http://localhost:1234${basePath}/somepage`);

    req.headers.set('Accept-Language', 'en-US,en;q=0.5');

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `https://en.test.com${basePath}/en/somepage`,
    );
  });

  it('should redirect to the correct browser locale changing the subdomain and trailingSlash', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        trailingSlash: true,
      },
      I18N_CONFIG: {
        locales: ['en', 'es'],
        defaultLocale: 'es',
        domains: {
          'en.test.com': {
            defaultLocale: 'en',
            protocol: 'http',
          },
          'es.test.com': {
            defaultLocale: 'es',
          },
        },
      },
    };

    const req = new Request(`http://es.test.com${basePath}/somepage`);

    req.headers.set('Accept-Language', 'en-US,en;q=0.5');

    const response = await testRequest(req);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `http://en.test.com${basePath}/en/somepage/`,
    );
  });

  it('should redirect with trailingSlash', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        trailingSlash: true,
      },
    };
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}/es/somepage`),
    );
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      `http://localhost:1234${basePath}/es/somepage/`,
    );
  });

  it('should redirect with locale and trailingSlash', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        trailingSlash: true,
      },
    };
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}/somepage`),
    );
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(`${basePath}/es/somepage/`);
  });

  it('should return a page with layout and i18n', async () => {
    const response = await testRequest(
      new Request(`http://localhost:1234${basePath}/es/somepage`),
    );
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<html lang="es" dir="ltr">');
    expect(html).toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain('<h1>Some page</h1>');
  });

  it('should be possible to fetch an api route GET', async () => {
    const response = await testRequest(
      new Request(`http:///localhost:1234${basePath}/es/api/example`),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ hello: 'world' });
  });

  it('should not be possible to fetch an api route GET without the correct basePath', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        basePath: '/incorrect',
      },
    };
    const response = await testRequest(
      new Request(`http:///localhost:1234${basePath}/es/api/example`),
    );
    expect(response.status).toBe(404);
  });

  it('should be possible to fetch an api route POST with a FormData', async () => {
    const body = new FormData();

    body.append('name', 'Brisa');
    body.append('email', 'test@brisa.com');

    const response = await testRequest(
      new Request(`http:///localhost:1234${basePath}/es/api/example`, {
        method: 'POST',
        body,
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ name: 'Brisa', email: 'test@brisa.com' });
  });

  it('should return 404 page if the api route does not exist', async () => {
    const response = await testRequest(
      new Request(`http:///localhost:1234${basePath}/es/api/not-found`),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      '<h1>Page not found 404 <web-component></web-component></h1>',
    );
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/_404.tsx"></script>`,
    );
  });

  it('should return 404 page if the api route exist but the method does not', async () => {
    const response = await testRequest(
      new Request(`http:///localhost:1234${basePath}/es/api/example`, {
        method: 'PUT',
      }),
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('<title id="title">Page not found</title>');
    expect(html).not.toContain('<title id="title">CUSTOM LAYOUT</title>');
    expect(html).toContain(
      '<h1>Page not found 404 <web-component></web-component></h1>',
    );
    expect(html).toContain(
      `<script async fetchpriority="high" src="${basePath}/_brisa/pages/_404.tsx"></script>`,
    );
  });

  it('should return an asset in gzip if the browser accept it', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        assetCompression: true,
      },
    };
    const textDecoder = new TextDecoder('utf-8');
    const req = new Request(
      `http:///localhost:1234${basePath}/some-dir/some-text.txt`,
      {
        headers: {
          'accept-encoding': 'gzip',
        },
      },
    );
    const response = await testRequest(req);
    const textBuffer = Bun.gunzipSync(
      new Uint8Array(await response.arrayBuffer()),
    );
    const text = textDecoder.decode(textBuffer);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-encoding')).toBe('gzip');
    expect(response.headers.get('vary')).toBe('Accept-Encoding');
    expect(response.headers.get('content-type')).toBe(
      'text/plain;charset=utf-8',
    );
    expect(text).toBe('Some text :D');
  });

  it('should not return in DEVELOPMENT an asset in gzip', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: false,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        assetCompression: true,
      },
    };
    const req = new Request(
      `http:///localhost:1234${basePath}/some-dir/some-text.txt`,
      {
        headers: {
          'accept-encoding': 'gzip',
        },
      },
    );
    const response = await testRequest(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-encoding')).toBe(null);
    expect(response.headers.get('vary')).toBe(null);
    expect(response.headers.get('content-type')).toBe(
      'text/plain;charset=utf-8',
    );
  });

  it('should not return in PRODUCTION an asset in zip when CONFIG.assetCompression is false', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        assetCompression: false,
      },
    };
    const req = new Request(
      `http:///localhost:1234${basePath}/some-dir/some-text.txt`,
      {
        headers: {
          'accept-encoding': 'gzip',
        },
      },
    );
    const response = await testRequest(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-encoding')).toBe(null);
    expect(response.headers.get('vary')).toBe(null);
    expect(response.headers.get('content-type')).toBe(
      'text/plain;charset=utf-8',
    );
  });

  it('should return an asset in brotli if the browser accept it and the "brotli" option is enabled', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        assetCompression: true,
      },
    };
    const textDecoder = new TextDecoder('utf-8');
    const req = new Request(
      `http:///localhost:1234${basePath}/some-dir/some-text.txt`,
      {
        headers: {
          'accept-encoding': 'br',
        },
      },
    );
    const response = await testRequest(req);
    const textBuffer = brotliDecompressSync(
      new Uint8Array(await response.arrayBuffer()),
    );
    const text = textDecoder.decode(textBuffer);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-encoding')).toBe('br');
    expect(response.headers.get('vary')).toBe('Accept-Encoding');
    expect(response.headers.get('content-type')).toBe(
      'text/plain;charset=utf-8',
    );
    expect(text).toBe('Some text :D');
  });

  it('should not return in DEVELOPMENT an asset in brotli', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: false,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        assetCompression: true,
      },
    };
    const req = new Request(
      `http:///localhost:1234${basePath}/some-dir/some-text.txt`,
      {
        headers: {
          'accept-encoding': 'br',
        },
      },
    );
    const response = await testRequest(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-encoding')).toBe(null);
    expect(response.headers.get('vary')).toBe(null);
    expect(response.headers.get('content-type')).toBe(
      'text/plain;charset=utf-8',
    );
  });

  it('should not return in PRODUCTION an asset in brotli when CONFIG.assetCompression is false', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
      CONFIG: {
        ...globalThis.mockConstants?.CONFIG,
        assetCompression: false,
      },
    };
    const req = new Request(
      `http:///localhost:1234${basePath}/some-dir/some-text.txt`,
      {
        headers: {
          'accept-encoding': 'br',
        },
      },
    );
    const response = await testRequest(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-encoding')).toBe(null);
    expect(response.headers.get('vary')).toBe(null);
    expect(response.headers.get('content-type')).toBe(
      'text/plain;charset=utf-8',
    );
  });

  it('should not return an asset with incorrect basePath', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      CONFIG: {
        basePath: '/incorrect',
      },
    };
    const req = new Request(
      `http:///localhost:1234${basePath}/some-dir/some-text.txt`,
      {
        headers: {
          'accept-encoding': 'gzip',
        },
      },
    );
    const response = await testRequest(req);
    expect(response.status).toBe(404);
  });

  it('should cache client page code in production', async () => {
    globalThis.mockConstants = {
      ...getConstants(),
      IS_PRODUCTION: true,
      HEADERS: {
        CACHE_CONTROL: 'public, max-age=31536000, immutable',
      },
    };
    const mockFile = spyOn(Bun, 'file').mockImplementation(
      () =>
        ({
          text: (pathname: string) => Promise.resolve(pathname),
        }) as BunFile,
    );
    const response = await testRequest(
      new Request(`http:///localhost:1234${basePath}/_brisa/pages/somepage`),
    );

    mockFile.mockRestore();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    );
  });

  it('should not cache client page code in development', async () => {
    const mockFile = spyOn(Bun, 'file').mockImplementation(
      () =>
        ({
          text: (pathname: string) => Promise.resolve(pathname),
        }) as BunFile,
    );
    const response = await testRequest(
      new Request(`http:///localhost:1234${basePath}/_brisa/pages/somepage`),
    );

    mockFile.mockRestore();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      'no-store, must-revalidate',
    );
  });

  it('should subscribe to hotload when "open" the websocket connection in development', async () => {
    const serverOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    const socket = serverOptions!.websocket;
    const mockSubscribe = mock(() => {});
    const ws = {
      data: { id: '1234' },
      subscribe: mockSubscribe,
    } as unknown as ServerWebSocket;

    socket.open(ws);

    expect(mockSubscribe).toHaveBeenCalledWith('hot-reload');
  });

  it('should NOT subscribe to hotload when "open" the websocket connection in production', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
    };

    const serverOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    const socket = serverOptions!.websocket;
    const mockSubscribe = mock(() => {});
    const ws = {
      data: { id: '1234' },
      subscribe: mockSubscribe,
    } as unknown as ServerWebSocket;

    socket.open(ws);

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('should call the "open" method of the websocket module', async () => {
    const serverOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    const socket = serverOptions!.websocket;
    const mockLog = spyOn(console, 'log');
    const ws = {
      data: { id: '1234' },
      subscribe: () => {},
    } as unknown as ServerWebSocket;

    socket.open(ws);

    expect(mockLog).toHaveBeenCalledWith('open');
  });

  it('should unsubscribe to hotload when "close" the websocket connection in development', async () => {
    const serverOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    const socket = serverOptions!.websocket;
    const mockUnsubscribe = mock(() => {});
    const ws = {
      data: { id: '1234' },
      unsubscribe: mockUnsubscribe,
    } as unknown as ServerWebSocket;

    socket.close(ws);

    expect(mockUnsubscribe).toHaveBeenCalledWith('hot-reload');
  });

  it('should NOT unsubscribe to hotload when "close" the websocket connection in production', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: true,
    };

    const serverOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    const socket = serverOptions!.websocket;
    const mockUnsubscribe = mock(() => {});
    const ws = {
      data: { id: '1234' },
      unsubscribe: mockUnsubscribe,
    } as unknown as ServerWebSocket;

    socket.close(ws);

    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });

  it('should call the "close" method of the websocket module', async () => {
    const serverOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    const socket = serverOptions!.websocket;
    const mockLog = spyOn(console, 'log');
    const ws = {
      data: { id: '1234' },
      unsubscribe: () => {},
    } as unknown as ServerWebSocket;

    socket.close(ws);

    expect(mockLog).toHaveBeenCalledWith('close');
  });

  it('should call the "drain" method of the websocket module', async () => {
    const serverOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    const socket = serverOptions!.websocket;
    const mockLog = spyOn(console, 'log');
    const ws = {
      data: { id: '1234' },
      subscribe: () => {},
    } as unknown as ServerWebSocket;

    socket.drain(ws);

    expect(mockLog).toHaveBeenCalledWith('drain');
  });

  it('should call the "message" method of the websocket module', async () => {
    const serverOptions = await (
      await import('./serve-options')
    ).getServeOptions();

    const socket = serverOptions!.websocket;
    const mockLog = spyOn(console, 'log');
    const ws = {
      data: { id: '1234' },
      subscribe: () => {},
    } as unknown as ServerWebSocket;

    socket.message(ws, 'hello test');

    expect(mockLog).toHaveBeenCalledWith('message', 'hello test');
  });

  it('should have req.renderInitiator with "SERVER_ACTION" when is POST method and has x-action header', async () => {
    const mockResponseAction = mock((req: RequestContext) => {});

    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      I18N_CONFIG: undefined,
    };

    mock.module('@/utils/response-action', () => ({
      default: (req: RequestContext) => mockResponseAction(req),
    }));

    await testRequest(
      new Request(`http://localhost:1234${basePath}/somepage`, {
        method: 'POST',
        headers: {
          'x-action': 'a1_1',
        },
      }),
    );

    expect(mockResponseAction.mock.calls[0][0].renderInitiator).toBe(
      RenderInitiator.SERVER_ACTION,
    );
  });

  it('should have req.renderInitiator with "SERVER_ACTION" when is POST method and has x-action header and i18n', async () => {
    const mockResponseAction = mock((req: RequestContext) => {});

    mock.module('@/utils/response-action', () => ({
      default: (req: RequestContext) => mockResponseAction(req),
    }));

    await testRequest(
      new Request(`http://localhost:1234${basePath}/es/somepage`, {
        method: 'POST',
        headers: {
          'x-action': 'a1_1',
        },
      }),
    );

    expect(mockResponseAction.mock.calls[0][0].renderInitiator).toBe(
      RenderInitiator.SERVER_ACTION,
    );
  });

  it('should have req.renderInitiator with "SPA_NAVIGATION" when the Page is POST method without x-action header', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      I18N_CONFIG: undefined,
    };

    const res = await testRequest(
      new Request(`http://localhost:1234${basePath}/somepage`, {
        method: 'POST',
        body: '{}',
      }),
    );

    // Response x-renderInitiator is the same as the requestContext.renderInitiator (modified in the fixture)
    expect(res.headers.get('x-renderInitiator')).toBe(
      RenderInitiator.SPA_NAVIGATION,
    );
  });

  it('should have req.renderInitiator with "SPA_NAVIGATION" when the Page is POST method without x-action header and i18n', async () => {
    const res = await testRequest(
      new Request(`http://localhost:1234${basePath}/es/somepage`, {
        method: 'POST',
        body: '{}',
      }),
    );

    // Response x-renderInitiator is the same as the requestContext.renderInitiator (modified in the fixture)
    expect(res.headers.get('x-renderInitiator')).toBe(
      RenderInitiator.SPA_NAVIGATION,
    );
  });

  it('should have req.renderInitiator with "INITIAL_REQUEST" when the Page is GET method', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      I18N_CONFIG: undefined,
    };

    const res = await testRequest(
      new Request(`http://localhost:1234${basePath}/somepage`, {
        method: 'GET',
      }),
    );

    // Response x-renderInitiator is the same as the requestContext.renderInitiator (modified in the fixture)
    expect(res.headers.get('x-renderInitiator')).toBe(
      RenderInitiator.INITIAL_REQUEST,
    );
  });

  it('should have req.renderInitiator with "INITIAL_REQUEST" when the Page is GET method and i18n', async () => {
    const res = await testRequest(
      new Request(`http://localhost:1234${basePath}/es/somepage`, {
        method: 'GET',
      }),
    );

    // Response x-renderInitiator is the same as the requestContext.renderInitiator (modified in the fixture)
    expect(res.headers.get('x-renderInitiator')).toBe(
      RenderInitiator.INITIAL_REQUEST,
    );
  });

  it('should have req.renderInitiator with "INITIAL_REQUEST" when is POST method and is an API endpoint', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      I18N_CONFIG: undefined,
    };
    const body = new FormData();

    body.append('name', 'Brisa');
    body.append('email', 'test@brisa.com');

    const res = await testRequest(
      new Request(`http:///localhost:1234${basePath}/api/example`, {
        method: 'POST',
        body,
      }),
    );

    // Response x-renderInitiator is the same as the requestContext.renderInitiator (modified in the fixture)
    expect(res.headers.get('x-renderInitiator')).toBe(
      RenderInitiator.INITIAL_REQUEST,
    );
  });

  it('should have req.renderInitiator with "INITIAL_REQUEST" when is POST method and is an API endpoint and i18n', async () => {
    const body = new FormData();

    body.append('name', 'Brisa');
    body.append('email', 'test@brisa.com');

    const res = await testRequest(
      new Request(`http:///localhost:1234${basePath}/es/api/example`, {
        method: 'POST',
        body,
      }),
    );

    // Response x-renderInitiator is the same as the requestContext.renderInitiator (modified in the fixture)
    expect(res.headers.get('x-renderInitiator')).toBe(
      RenderInitiator.INITIAL_REQUEST,
    );
  });

  it('should have req.renderInitiator with "INITIAL_REQUEST" when is POST method and is an API endpoint with x-action header', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      I18N_CONFIG: undefined,
    };
    const body = new FormData();

    body.append('name', 'Brisa');
    body.append('email', 'test@brisa.com');

    const res = await testRequest(
      new Request(`http:///localhost:1234${basePath}/api/example`, {
        method: 'POST',
        body,
        headers: {
          'x-action': 'a1_1',
        },
      }),
    );

    // Response x-renderInitiator is the same as the requestContext.renderInitiator (modified in the fixture)
    expect(res.headers.get('x-renderInitiator')).toBe(
      RenderInitiator.INITIAL_REQUEST,
    );
  });

  it('should have req.renderInitiator with "INITIAL_REQUEST" when is POST method and is an API endpoint with x-action header and i18n', async () => {
    const body = new FormData();

    body.append('name', 'Brisa');
    body.append('email', 'test@brisa.com');

    const res = await testRequest(
      new Request(`http:///localhost:1234${basePath}/es/api/example`, {
        method: 'POST',
        body,
        headers: {
          'x-action': 'a1_1',
        },
      }),
    );

    // Response x-renderInitiator is the same as the requestContext.renderInitiator (modified in the fixture)
    expect(res.headers.get('x-renderInitiator')).toBe(
      RenderInitiator.INITIAL_REQUEST,
    );
  });

  it('should NOT call responseAction method with GET and return 200 with the page', async () => {
    const mockResponseAction = mock((req: RequestContext) => {});

    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      I18N_CONFIG: undefined,
    };
    mock.module('@/utils/response-action', () => ({
      default: (req: RequestContext) => mockResponseAction(req),
    }));

    const res = await testRequest(
      new Request(`http://localhost:1234${basePath}/somepage`, {
        method: 'GET',
        headers: {
          'x-action': 'a1_1',
        },
      }),
    );

    expect(mockResponseAction).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<h1>Some page</h1>');
  });

  it('should call responseAction method when is an action', async () => {
    const mockResponseAction = mock((req: RequestContext) => {});

    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      I18N_CONFIG: undefined,
    };
    mock.module('@/utils/response-action', () => ({
      default: (req: RequestContext) => mockResponseAction(req),
    }));

    await testRequest(
      new Request(`http://localhost:1234${basePath}/somepage`, {
        method: 'POST',
        headers: {
          'x-action': 'a1_1',
        },
      }),
    );

    expect(mockResponseAction).toHaveBeenCalled();
    expect(mockResponseAction.mock.calls[0][0].i18n.locale).toBeEmpty();
  });

  it('should call responseAction method when is an action and has i18n', async () => {
    const mockResponseAction = mock((req: RequestContext) => {});

    mock.module('@/utils/response-action', () => ({
      default: (req: RequestContext) => mockResponseAction(req),
    }));

    await testRequest(
      new Request(`http://localhost:1234${basePath}/es/somepage`, {
        method: 'POST',
        headers: {
          'x-action': 'a1_1',
        },
      }),
    );

    expect(mockResponseAction).toHaveBeenCalled();
    expect(mockResponseAction.mock.calls[0][0].i18n.locale).toBe('es');
  });

  it('should open the editor calling /__brisa_dev_file__ with file, line and column', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: false,
      IS_DEVELOPMENT: true,
    };
    const mockOpenInEditor = spyOn(Bun, 'openInEditor').mockImplementation(
      () => {},
    );
    const response = await testRequest(
      new Request(
        `http://localhost:1234/__brisa_dev_file__?file=${encodeURIComponent(
          'src/pages/somepage.tsx',
        )}&line=1&column=1`,
        { method: 'POST' },
      ),
    );

    expect(response.status).toBe(200);
    expect(mockOpenInEditor).toHaveBeenCalledWith('src/pages/somepage.tsx', {
      line: 1,
      column: 1,
    });
  });

  it('should open the editor calling /__brisa_dev_file__ with internal brisa file from build with line and column', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: false,
      IS_DEVELOPMENT: true,
    };
    const mockOpenInEditor = spyOn(Bun, 'openInEditor').mockImplementation(
      () => {},
    );
    const inputFile = encodeURIComponent(
      '/_brisa/pages/index-595519026220381824.js',
    );
    const expectedFile = path.resolve(
      BUILD_DIR,
      'pages-client',
      'index-595519026220381824.js',
    );
    const response = await testRequest(
      new Request(
        `http://localhost:1234/__brisa_dev_file__?file=${inputFile}&line=1&column=1`,
        {
          method: 'POST',
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(mockOpenInEditor).toHaveBeenCalledWith(expectedFile, {
      line: 1,
      column: 1,
    });
  });

  it('should return 404 trying to open the editor calling /__brisa_dev_file__ with file, line and column with method GET', async () => {
    globalThis.mockConstants = {
      ...globalThis.mockConstants,
      IS_PRODUCTION: false,
      IS_DEVELOPMENT: true,
    };
    const mockOpenInEditor = spyOn(Bun, 'openInEditor').mockImplementation(
      () => {},
    );
    const response = await testRequest(
      new Request(
        `http://localhost:1234/__brisa_dev_file__?file=${encodeURIComponent(
          'src/pages/somepage.tsx',
        )}&line=1&column=1`,
        { method: 'GET' },
      ),
    );

    expect(response.status).toBe(404);
    expect(mockOpenInEditor).not.toHaveBeenCalled();
  });
});
