import { it, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import net from 'node:net';
import http from 'node:http';
import path from 'node:path';
import url from 'node:url';

const FIXTURES_DIR = path.resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '__fixtures__',
);

const absolutePath = url.pathToFileURL(
  path.resolve(import.meta.dirname, '../../../../server/node.js'),
).href;

describe('Node.js handler', () => {
  beforeEach(() => {
    globalThis.mockConstants = undefined;
  });
  afterEach(() => {
    globalThis.mockConstants = undefined;
  });
  it('should resolve a page', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
      CONFIG: {},
      HEADERS: {
        CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
      },
      LOG_PREFIX: {},
    };
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/';
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 200);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.strictEqual(res.getBody().includes('<title>Brisa</title><'), true);
    assert.deepStrictEqual(res.headers, {
      'cache-control': 'no-cache, no-store, must-revalidate',
      'content-type': 'text/html; charset=utf-8',
      'transfer-encoding': 'chunked',
      'x-test': 'success',
      vary: 'Accept-Encoding',
    });
  });

  it('should redirect to the locale', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
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
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/somepage';
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 301);
    assert.deepStrictEqual(res.headers, {
      'cache-control': 'no-cache, no-store, must-revalidate',
      expires: '-1',
      location: '/es/somepage',
      pragma: 'no-cache',
      vary: 'Accept-Language',
    });
  });

  it('should redirect to trailingSlash', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
      CONFIG: {
        trailingSlash: true,
      },
      HEADERS: {
        CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
      },
      LOG_PREFIX: {},
    };
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/somepage';
    req.headers = {
      host: 'localhost',
    };
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 301);
    assert.deepStrictEqual(res.headers, {
      'cache-control': 'no-cache, no-store, must-revalidate',
      expires: '-1',
      location: 'http://localhost/somepage/',
      pragma: 'no-cache',
      vary: 'Accept-Language',
    });
  });

  it('should redirect locale and trailing slash', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
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
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/somepage';
    req.headers = {
      host: 'localhost',
    };
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 301);
    assert.deepStrictEqual(res.headers, {
      'cache-control': 'no-cache, no-store, must-revalidate',
      expires: '-1',
      location: '/es/somepage/',
      pragma: 'no-cache',
      vary: 'Accept-Language',
    });
  });

  it('should serve an asset', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
      CONFIG: {},
      HEADERS: {
        CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
      },
      LOG_PREFIX: {},
    };
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/favicon.ico';
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.headers, {
      'cache-control': 'no-cache, no-store, must-revalidate',
      'content-type': 'image/vnd.microsoft.icon',
    });
  });

  it('should return 404 if the asset does not exist', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
      CONFIG: {},
      HEADERS: {
        CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
      },
      LOG_PREFIX: {},
    };
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/not-found.ico';
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 404);
  });

  it('should redirect from trailingSlash to non-trailingSlash', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
      CONFIG: {},
      HEADERS: {
        CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
      },
      LOG_PREFIX: {},
    };
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/somepage/';
    req.headers = {
      host: 'localhost',
    };
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 301);
    assert.deepStrictEqual(res.headers, {
      'cache-control': 'no-cache, no-store, must-revalidate',
      expires: '-1',
      location: 'http://localhost/somepage',
      pragma: 'no-cache',
      vary: 'Accept-Language',
    });
  });

  it('should api route work', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
      CONFIG: {},
      HEADERS: {
        CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
      },
      LOG_PREFIX: {},
    };
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/api/test';
    req.method = 'GET';
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.headers, {
      'content-type': 'application/json',
    });
    assert.strictEqual(res.getBody(), '{"test":"test"}');
  });

  it('should redirect an api route to the locale', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
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
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/api/test';
    req.method = 'GET';
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 301);
    assert.deepStrictEqual(res.headers, {
      'cache-control': 'no-cache, no-store, must-revalidate',
      expires: '-1',
      location: '/es/api/test',
      pragma: 'no-cache',
      vary: 'Accept-Language',
    });
  });

  it('should redirect an api route to the locale and trailing slash', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
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
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/api/test';
    req.method = 'GET';
    req.headers = {
      host: 'localhost',
    };
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 301);
    assert.deepStrictEqual(res.headers, {
      'cache-control': 'no-cache, no-store, must-revalidate',
      expires: '-1',
      location: '/es/api/test/',
      pragma: 'no-cache',
      vary: 'Accept-Language',
    });
  });

  it('should work with slow streaming', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
      CONFIG: {
        trailingSlash: false,
      },
      HEADERS: {
        CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
      },
      LOG_PREFIX: {},
    };
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/slow-streaming';
    req.method = 'GET';
    req.headers = {
      host: 'localhost',
    };

    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);

    await handler(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.headers, {
      'cache-control': 'no-cache, no-store, must-revalidate',
      'content-type': 'text/html; charset=utf-8',
      'transfer-encoding': 'chunked',
      vary: 'Accept-Encoding',
    });

    // Wait all writes to be done
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const body = res.getBody();

    assert.strictEqual(
      body.includes(
        '<ul><li>first </li><li>second </li><li>third </li><li>fourth </li><li>fifth </li><li>sixth</li></ul>',
      ),
      true,
    );
  });

  it('should redirect work with params', async () => {
    globalThis.mockConstants = {
      IS_SERVE_PROCESS: true,
      ROOT_DIR: FIXTURES_DIR,
      SRC_DIR: path.join(FIXTURES_DIR, 'js'),
      BUILD_DIR: path.join(FIXTURES_DIR, 'js'),
      ASSETS_DIR: path.join(FIXTURES_DIR, 'public'),
      PAGES_DIR: path.join(FIXTURES_DIR, 'js', 'pages'),
      CONFIG: {
        trailingSlash: true,
      },
      HEADERS: {
        CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
      },
      LOG_PREFIX: {},
    };
    const req = new http.IncomingMessage(new net.Socket());
    req.url = '/api/test?test=1';
    req.method = 'GET';
    req.headers = {
      host: 'localhost',
    };
    const res = createMockResponse(req);
    const handler = await import(absolutePath).then((m) => m.handler);
    await handler(req, res);
    assert.strictEqual(res.statusCode, 301);
    assert.deepStrictEqual(res.headers, {
      'cache-control': 'no-cache, no-store, must-revalidate',
      expires: '-1',
      location: 'http://localhost/api/test/?test=1',
      pragma: 'no-cache',
      vary: 'Accept-Language',
    });
  });
});

function createMockResponse(req) {
  const res = new http.ServerResponse(req);
  const originalWrite = res.write.bind(res);
  const headers = {};
  let body = '';

  return {
    write: (chunk) => {
      body +=
        chunk instanceof Uint8Array ? Buffer.from(chunk).toString() : chunk;
      return originalWrite(chunk);
    },
    getBody: () => body,
    writeHead: res.writeHead.bind(res),
    on: res.on.bind(res),
    end: res.end.bind(res),
    off: res.off.bind(res),
    destroy: res.destroy.bind(res),
    getHeaderNames: res.getHeaderNames.bind(res),
    removeHeader: res.removeHeader.bind(res),
    setHeader: (name, value) => {
      headers[name.toLowerCase()] = value;
      return res.setHeader(name, value);
    },
    get headers() {
      return headers;
    },
    get statusCode() {
      return res.statusCode;
    },
  };
}
