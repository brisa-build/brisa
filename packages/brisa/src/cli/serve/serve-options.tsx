import type { ServerWebSocket, Serve } from 'bun';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import process from 'node:process';

import { getConstants } from '@/constants';
import type { MatchedBrisaRoute, RequestContext } from '@/types';
import extendRequestContext from '@/utils/extend-request-context';
import getImportableFilepath, {
  pathToFileURLWhenNeeded,
} from '@/utils/get-importable-filepath';
import getRouteMatcher from '@/utils/get-route-matcher';
import handleI18n from '@/utils/handle-i18n';
import importFileIfExists from '@/utils/import-file-if-exists';
import { isNotFoundError } from '@/utils/not-found';
import redirectTrailingSlash from '@/utils/redirect-trailing-slash';
import feedbackError from '@/utils/feedback-error';
import responseAction from '@/utils/response-action';
import { redirectFromUnnormalizedURL } from '@/utils/redirect';
import responseRenderedPage from '@/utils/response-rendered-page';
import { removeBasePathFromStringURL } from '@/utils/base-path';
import { isNavigateThrowable } from '@/utils/navigate/utils';
import { RenderInitiator } from '@/public-constants';
import { AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL } from '@/utils/ssr-web-component';
import getReadableStreamFromPath from '@/utils/get-readable-stream-from-path';
import getContentTypeFromPath from '@/utils/get-content-type-from-path';

export async function getServeOptions() {
  setUpEnvVars();

  const {
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    PAGE_404,
    PAGE_500,
    RESERVED_PAGES,
    BUILD_DIR,
    PORT,
    PAGES_DIR,
    ASSETS_DIR,
    CONFIG,
    JS_RUNTIME,
    LOG_PREFIX,
    HEADERS: { CACHE_CONTROL },
  } = getConstants();

  if (IS_PRODUCTION && !fs.existsSync(BUILD_DIR)) {
    console.log(
      LOG_PREFIX.ERROR,
      'Not exist "build" yet. Please run "brisa build" first',
    );
    return null;
  }

  if (!fs.existsSync(PAGES_DIR)) {
    const path = IS_PRODUCTION ? 'build/pages' : 'src/pages';
    const cli = IS_PRODUCTION ? 'brisa start' : 'brisa dev';

    console.log(
      LOG_PREFIX.ERROR,
      `Not exist ${path}" directory. It\'s required to run "${cli}"`,
    );
    return null;
  }

  let pagesRouter = getRouteMatcher(PAGES_DIR, RESERVED_PAGES);
  let rootRouter = getRouteMatcher(BUILD_DIR);

  const HOT_RELOAD_TOPIC = 'hot-reload';
  const PUBLIC_CLIENT_PAGE_SUFFIX = '/_brisa/pages/';
  const WEBSOCKET_PATH = getImportableFilepath('websocket', BUILD_DIR);
  const wsModule = WEBSOCKET_PATH ? await import(WEBSOCKET_PATH) : null;
  const route404 = pagesRouter.reservedRoutes[PAGE_404];
  const middlewareModule = await importFileIfExists('middleware', BUILD_DIR);
  const customMiddleware = middlewareModule?.default;
  const tls = CONFIG?.tls;
  const basePath = CONFIG?.basePath ?? '';

  // Options to start server
  return {
    port: PORT,
    development: !IS_PRODUCTION,
    idleTimeout: CONFIG.idleTimeout,
    async fetch(req: Request, server) {
      const requestId = crypto.randomUUID();
      const attachedData = wsModule?.attach
        ? ((await wsModule.attach(req)) ?? {})
        : {};

      if (server.upgrade(req, { data: { id: requestId, ...attachedData } })) {
        return;
      }

      const request = extendRequestContext({
        originalRequest: req,
        id: requestId,
      });
      const url = new URL(request.finalURL);

      // Dev tool to open file in editor
      if (
        IS_DEVELOPMENT &&
        url.pathname === '/__brisa_dev_file__' &&
        req.method === 'POST'
      ) {
        if (JS_RUNTIME !== 'bun') {
          // Note: This only happens on development, and we use
          // the Bun runtime in development. Other runtimes like
          // Node.js for now are only supported in production.
          return new Response(null, { status: 404 });
        }

        let file = url.searchParams.get('file');
        const line = url.searchParams.get('line');
        const column = url.searchParams.get('column');
        const brisaPages = path.sep + '_brisa' + path.sep + 'pages';

        if (file?.startsWith(brisaPages)) {
          file = path.join(
            BUILD_DIR,
            file.replace(brisaPages, path.sep + 'pages-client'),
          );
        }

        if (file && line != null && column != null) {
          Bun.openInEditor(file, { line: +line, column: +column });
          return new Response(null, { status: 200 });
        }
      }

      if (
        // This parameter is added after "notFound" function call, during the stream
        url.searchParams.get('_not-found') ||
        // Ignore requests that are not from the basePath
        !url.pathname.startsWith(basePath)
      ) {
        return error404(request);
      }

      // Remove basePath from URL
      if (basePath) {
        request.finalURL = removeBasePathFromStringURL(request.finalURL);
        url.pathname = removeBasePathFromStringURL(url.pathname);
      }

      const isClientPage = url.pathname.startsWith(PUBLIC_CLIENT_PAGE_SUFFIX);
      const assetPath = detectAsset(url, ASSETS_DIR);
      const i18nRes = assetPath ? {} : handleI18n(request);

      if (isClientPage) {
        const clientPagePath = path.join(
          BUILD_DIR,
          'pages-client',
          url.pathname.replace(PUBLIC_CLIENT_PAGE_SUFFIX, ''),
        );
        return serveAsset(clientPagePath, request);
      }

      const isValidRoute = () => {
        return (
          pagesRouter.match(request).route || rootRouter.match(request).route
        );
      };

      if (i18nRes.response) {
        return isValidRoute() ? i18nRes.response : error404(request);
      }

      if (i18nRes.pagesRouter && i18nRes.rootRouter) {
        pagesRouter = i18nRes.pagesRouter;
        rootRouter = i18nRes.rootRouter;
      }

      if (!assetPath) {
        const redirect = redirectTrailingSlash(request);

        if (redirect) return isValidRoute() ? redirect : error404(request);
      }

      request.getIP = () => server.requestIP(req);

      return handleRequest(request, { assetPath }).catch((error) => {
        // 404 page
        if (isNotFoundError(error)) return error404(request);

        // "navigate" function call
        if (isNavigateThrowable(error)) {
          // Here doesn't matter the render mode, because the navigate it's always
          // using a hard redirect
          return redirectFromUnnormalizedURL(
            new URL(error.message, url.origin),
            request,
          );
        }

        // Log some feedback in the terminal depending on the error
        // in development and production
        feedbackError(error, request);

        // 500 page
        const route500 = pagesRouter.reservedRoutes[PAGE_500];

        if (!route500) throw error;

        request.route = route500;

        return responseRenderedPage({
          req: request,
          route: route500,
          status: 500,
          error,
        });
      });
    },
    tls,
    websocket: {
      open: (ws) => {
        if (!globalThis.sockets) globalThis.sockets = new Map();
        const { id } = ws.data as unknown as { id: string };
        globalThis.sockets.set(id, ws);
        if (!IS_PRODUCTION) ws.subscribe(HOT_RELOAD_TOPIC);
        wsModule?.open?.(ws);
      },
      close: (ws) => {
        const { id } = ws.data as unknown as { id: string };
        globalThis.sockets?.delete?.(id);
        if (!IS_PRODUCTION) ws.unsubscribe(HOT_RELOAD_TOPIC);
        wsModule?.close?.(ws);
      },
      message: (ws, message: string) => {
        wsModule?.message?.(ws, message);
      },
      drain: (ws) => {
        wsModule?.drain?.(ws);
      },
    },
  } satisfies Serve;

  ///////////////////////////////////////////////////////
  ////////////////////// HELPERS ///////////////////////
  ///////////////////////////////////////////////////////
  async function handleRequest(
    req: RequestContext,
    { assetPath }: { assetPath: string | null },
  ) {
    const locale = req.i18n.locale;
    const url = new URL(req.finalURL);
    const firstPathnamePart = url.pathname.split('/')[locale ? 2 : 1];
    const { route, isReservedPathname } = pagesRouter.match(req);
    const isApi = firstPathnamePart === 'api';
    const api = isApi ? rootRouter.match(req) : null;

    req.route = (isApi ? api?.route : route) as MatchedBrisaRoute;

    // Middleware
    if (customMiddleware) {
      const middlewareResponse = await Promise.resolve().then(() =>
        customMiddleware(req),
      );

      if (middlewareResponse) return middlewareResponse;
    }

    // Assets
    if (assetPath) return serveAsset(assetPath, req);

    // Pages
    if (!isApi && route && !isReservedPathname) {
      const isPOST = req.method === 'POST';

      if (isPOST) {
        const isFormCallWithoutRPC = url.searchParams.has('_aid');

        if (!isFormCallWithoutRPC) {
          req.store.set(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL, true);
        }

        // Actions
        if (req.headers.has('x-action')) {
          req.renderInitiator = RenderInitiator.SERVER_ACTION;
          return responseAction(req);
        }
        req.renderInitiator = RenderInitiator.SPA_NAVIGATION;
      }

      return responseRenderedPage({ req, route });
    }

    // API
    if (isApi && api?.route && !api?.isReservedPathname) {
      const module = await import(pathToFileURLWhenNeeded(api.route.filePath));
      const method = req.method.toUpperCase();
      const response = module[method]?.(req);

      if (response) return response;
    }

    // 404 page
    return error404(req);
  }

  function serveAsset(path: string, req: RequestContext) {
    const encoding = req.headers.get('accept-encoding') || '';
    const isCompressionEnable = IS_PRODUCTION && CONFIG.assetCompression;
    let compressionFormat = '';

    if (isCompressionEnable && encoding.includes('br')) {
      compressionFormat = 'br';
    } else if (isCompressionEnable && encoding.includes('gzip')) {
      compressionFormat = 'gz';
    }

    const responseOptions = {
      headers: {
        'content-type': getContentTypeFromPath(path),
        'cache-control': CACHE_CONTROL,
        ...(compressionFormat
          ? {
              'content-encoding': compressionFormat === 'br' ? 'br' : 'gzip',
              vary: 'Accept-Encoding',
            }
          : {}),
      },
    };

    return new Response(
      compressionFormat
        ? getReadableStreamFromPath(`${path}.${compressionFormat}`)
        : getReadableStreamFromPath(path),
      responseOptions,
    );
  }

  function error404(req: RequestContext) {
    if (!route404) {
      return new Response('Not found', {
        status: 404,
        headers: { 'cache-control': CACHE_CONTROL },
      });
    }

    req.route = route404;

    return responseRenderedPage({ req, route: route404, status: 404 });
  }
}

function detectAsset(url: URL, assetsDir: string) {
  const isHome = url.pathname === '/';
  const assetPath = path.join(assetsDir, url.pathname);
  if (isHome) return null;
  if (fs.existsSync(assetPath)) return assetPath;
  if (fs.existsSync(assetPath + '.js')) return assetPath + '.js';
  return null;
}

export function setUpEnvVars(
  isCLI: boolean = Boolean(
    process.argv[1].includes(
      path.join('brisa', 'out', 'cli', 'serve', 'index.js'),
    ),
  ),
) {
  // This is necessary in case of Custom Server using the getServeOptions outside
  // the Brisa environment, otherwise this is set from the CLI.
  if (!isCLI) {
    if (!process.env.__CRYPTO_KEY__) {
      process.env.__CRYPTO_KEY__ = crypto.randomBytes(32).toString('hex');
    }
    if (!process.env.__CRYPTO_IV__) {
      process.env.__CRYPTO_IV__ = crypto.randomBytes(8).toString('hex');
    }
  }
  // This is necessary always to allow "prebuild" folder to be used
  if (!process.env.BRISA_BUILD_FOLDER) {
    process.env.BRISA_BUILD_FOLDER = path.join(process.cwd(), 'build');
  }
}

declare global {
  var sockets: Map<string, ServerWebSocket<unknown>> | undefined;
}
