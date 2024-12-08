import { assertEquals, assert } from 'jsr:@std/assert';
import { resolve } from 'node:path';

const FIXTURES_DIR = resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '__fixtures__',
);

const absolutePath = new URL('../../../../server/deno.js', import.meta.url)
  .href;

Deno.test('should resolve a page', async () => {
  globalThis.mockConstants = {
    IS_SERVE_PROCESS: true,
    ROOT_DIR: FIXTURES_DIR,
    SRC_DIR: resolve(FIXTURES_DIR, 'js'),
    BUILD_DIR: resolve(FIXTURES_DIR, 'js'),
    ASSETS_DIR: resolve(FIXTURES_DIR, 'public'),
    PAGES_DIR: resolve(FIXTURES_DIR, 'js', 'pages'),
    CONFIG: {},
    HEADERS: {
      CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
    },
    LOG_PREFIX: {},
  };

  const req = new Request('http://localhost/');
  const { handler } = await import(absolutePath);

  const response = await handler(req);
  assertEquals(response.status, 200);
  assert((await response.text()).includes('<title>Brisa</title><'));
  assertEquals(
    response.headers.get('cache-control'),
    'no-cache, no-store, must-revalidate',
  );
});

Deno.test('should redirect to the locale', async () => {
  globalThis.mockConstants = {
    IS_SERVE_PROCESS: true,
    ROOT_DIR: FIXTURES_DIR,
    SRC_DIR: resolve(FIXTURES_DIR, 'js'),
    BUILD_DIR: resolve(FIXTURES_DIR, 'js'),
    ASSETS_DIR: resolve(FIXTURES_DIR, 'public'),
    PAGES_DIR: resolve(FIXTURES_DIR, 'js', 'pages'),
    I18N_CONFIG: {
      locales: ['en', 'es'],
      defaultLocale: 'es',
    },
    LOCALES_SET: new Set(['en', 'es']),
    CONFIG: {},
    HEADERS: {
      CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
    },
    LOG_PREFIX: {},
  };

  const req = new Request('http://localhost/somepage');
  const { handler } = await import(absolutePath);

  const response = await handler(req);
  assertEquals(response.status, 301);
  assertEquals(response.headers.get('location'), '/es/somepage');
});

Deno.test('should redirect to trailingSlash', async () => {
  globalThis.mockConstants = {
    IS_SERVE_PROCESS: true,
    ROOT_DIR: FIXTURES_DIR,
    SRC_DIR: resolve(FIXTURES_DIR, 'js'),
    BUILD_DIR: resolve(FIXTURES_DIR, 'js'),
    ASSETS_DIR: resolve(FIXTURES_DIR, 'public'),
    PAGES_DIR: resolve(FIXTURES_DIR, 'js', 'pages'),
    CONFIG: {
      trailingSlash: true,
    },
    HEADERS: {
      CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
    },
    LOG_PREFIX: {},
  };

  const req = new Request('http://localhost/somepage');
  const { handler } = await import(absolutePath);

  const response = await handler(req);
  assertEquals(response.status, 301);
  assertEquals(response.headers.get('location'), 'http://localhost/somepage/');
});

Deno.test('should redirect locale and trailing slash', async () => {
  globalThis.mockConstants = {
    IS_SERVE_PROCESS: true,
    ROOT_DIR: FIXTURES_DIR,
    SRC_DIR: resolve(FIXTURES_DIR, 'js'),
    BUILD_DIR: resolve(FIXTURES_DIR, 'js'),
    ASSETS_DIR: resolve(FIXTURES_DIR, 'public'),
    PAGES_DIR: resolve(FIXTURES_DIR, 'js', 'pages'),
    I18N_CONFIG: {
      locales: ['en', 'es'],
      defaultLocale: 'es',
    },
    LOCALES_SET: new Set(['en', 'es']),
    CONFIG: {
      trailingSlash: true,
    },
    HEADERS: {
      CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
    },
    LOG_PREFIX: {},
  };

  const req = new Request('http://localhost/somepage');
  const { handler } = await import(absolutePath);

  const response = await handler(req);
  assertEquals(response.status, 301);
  assertEquals(response.headers.get('location'), '/es/somepage/');
});

Deno.test('should return 404 if the asset does not exist', async () => {
  globalThis.mockConstants = {
    IS_SERVE_PROCESS: true,
    ROOT_DIR: FIXTURES_DIR,
    SRC_DIR: resolve(FIXTURES_DIR, 'js'),
    BUILD_DIR: resolve(FIXTURES_DIR, 'js'),
    ASSETS_DIR: resolve(FIXTURES_DIR, 'public'),
    PAGES_DIR: resolve(FIXTURES_DIR, 'js', 'pages'),
    CONFIG: {},
    HEADERS: {
      CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
    },
    LOG_PREFIX: {},
  };

  const req = new Request('http://localhost/not-found.ico');
  const { handler } = await import(absolutePath);

  const response = await handler(req);
  assertEquals(response.status, 404);
});
