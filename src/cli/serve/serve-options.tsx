import { type MatchedRoute, type ServerWebSocket, type Serve } from "bun";
import fs from "node:fs";
import path from "node:path";

import { getConstants } from "@/constants";
import type { RequestContext } from "@/types";
import extendRequestContext from "@/utils/extend-request-context";
import getImportableFilepath from "@/utils/get-importable-filepath";
import getRouteMatcher from "@/utils/get-route-matcher";
import handleI18n from "@/utils/handle-i18n";
import importFileIfExists from "@/utils/import-file-if-exists";
import { isNotFoundError } from "@/utils/not-found";
import processPageRoute from "@/utils/process-page-route";
import redirectTrailingSlash from "@/utils/redirect-trailing-slash";
import renderToReadableStream from "@/utils/render-to-readable-stream";
import feedbackError from "@/utils/feedback-error";

export async function getServeOptions() {
  const {
    IS_PRODUCTION,
    PAGE_404,
    PAGE_500,
    RESERVED_PAGES,
    BUILD_DIR,
    PORT,
    PAGES_DIR,
    ASSETS_DIR,
    CONFIG,
    LOG_PREFIX,
  } = getConstants();

  const CACHE_CONTROL = IS_PRODUCTION
    ? "public, max-age=31536000, immutable"
    : "no-store, must-revalidate";

  if (IS_PRODUCTION && !fs.existsSync(BUILD_DIR)) {
    console.log(
      LOG_PREFIX.ERROR,
      'Not exist "build" yet. Please run "brisa build" first',
    );
    return null;
  }

  if (!fs.existsSync(PAGES_DIR)) {
    const path = IS_PRODUCTION ? "build/pages" : "src/pages";
    const cli = IS_PRODUCTION ? "brisa start" : "brisa dev";

    console.log(
      LOG_PREFIX.ERROR,
      `Not exist ${path}" directory. It\'s required to run "${cli}"`,
    );
    return null;
  }

  let pagesRouter = getRouteMatcher(PAGES_DIR, RESERVED_PAGES);
  let rootRouter = getRouteMatcher(BUILD_DIR);

  const HOT_RELOAD_TOPIC = "hot-reload";
  const PUBLIC_CLIENT_PAGE_SUFFIX = "/_brisa/pages/";
  const WEBSOCKET_PATH = getImportableFilepath("websocket", BUILD_DIR);
  const wsModule = WEBSOCKET_PATH ? await import(WEBSOCKET_PATH) : null;
  const route404 = pagesRouter.reservedRoutes[PAGE_404];
  const middlewareModule = await importFileIfExists("middleware", BUILD_DIR);
  const customMiddleware = middlewareModule?.default;
  const tls = CONFIG?.tls;

  // Options to start server
  return {
    port: PORT,
    development: !IS_PRODUCTION,
    async fetch(req: Request, server) {
      const requestId = crypto.randomUUID();
      const attachedData = wsModule?.attach
        ? (await wsModule.attach(req)) ?? {}
        : {};

      if (server.upgrade(req, { data: { id: requestId, ...attachedData } })) {
        return;
      }

      const request = extendRequestContext({
        originalRequest: req,
        id: requestId,
      });
      const url = new URL(request.finalURL);
      const assetPath = path.join(ASSETS_DIR, url.pathname);
      const isHome = url.pathname === "/";
      const isClientPage = url.pathname.startsWith(PUBLIC_CLIENT_PAGE_SUFFIX);
      const isAnAsset = !isHome && fs.existsSync(assetPath);
      const i18nRes = isAnAsset ? {} : handleI18n(request);

      if (isClientPage) {
        const clientPagePath = path.join(
          BUILD_DIR,
          "pages-client",
          url.pathname.replace(PUBLIC_CLIENT_PAGE_SUFFIX, ""),
        );
        return serveAsset(clientPagePath, request);
      }

      const isValidRoute = () => {
        return (
          pagesRouter.match(request).route || rootRouter.match(request).route
        );
      };

      // This parameter is added after "notFound" function call, during the stream
      if (url.searchParams.get("_not-found")) {
        return error404(request);
      }

      if (i18nRes.response) {
        return isValidRoute() ? i18nRes.response : error404(request);
      }

      if (i18nRes.pagesRouter && i18nRes.rootRouter) {
        pagesRouter = i18nRes.pagesRouter;
        rootRouter = i18nRes.rootRouter;
      }

      if (!isAnAsset) {
        const redirect = redirectTrailingSlash(request);

        if (redirect) return isValidRoute() ? redirect : error404(request);
      }

      request.getIP = () => server.requestIP(req);

      return handleRequest(request, isAnAsset).catch((error) => {
        // 404 page
        if (isNotFoundError(error)) return error404(request);

        // Log some feedback in the terminal depending on the error
        // in development and production
        feedbackError(error);

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
  async function handleRequest(req: RequestContext, isAnAsset: boolean) {
    const locale = req.i18n.locale;
    const url = new URL(req.finalURL);
    const pathname = url.pathname;
    const { route, isReservedPathname } = pagesRouter.match(req);
    const isApi = pathname.startsWith(locale ? `/${locale}/api/` : "/api/");
    const api = isApi ? rootRouter.match(req) : null;

    req.route = (isApi ? api?.route : route) as MatchedRoute;

    // Middleware
    if (customMiddleware) {
      const middlewareResponse = await Promise.resolve().then(() =>
        customMiddleware(req),
      );

      if (middlewareResponse) return middlewareResponse;
    }

    // Pages
    if (!isApi && route && !isReservedPathname) {
      return responseRenderedPage({ req, route });
    }

    // API
    if (isApi && api?.route && !api?.isReservedPathname) {
      const module = await import(api.route.filePath);
      const method = req.method.toUpperCase();
      const response = module[method]?.(req);

      if (response) return response;
    }

    // Assets
    if (isAnAsset) {
      const assetPath = path.join(ASSETS_DIR, url.pathname);
      return serveAsset(assetPath, req);
    }

    // 404 page
    return error404(req);
  }

  function serveAsset(path: string, req: RequestContext) {
    const isGzip = req.headers.get("accept-encoding")?.includes?.("gzip");
    const file = Bun.file(path);
    const gzipHeaders = {
      "content-encoding": "gzip",
      vary: "Accept-Encoding",
    };
    const responseOptions = {
      headers: {
        "content-type": file.type,
        "cache-control": CACHE_CONTROL,
        ...(isGzip ? gzipHeaders : {}),
      },
    };

    return new Response(
      isGzip ? Bun.file(`${path}.gz`) : file,
      responseOptions,
    );
  }

  async function responseRenderedPage({
    req,
    route,
    status = 200,
    error,
  }: {
    req: RequestContext;
    route: MatchedRoute;
    status?: number;
    error?: Error;
  }) {
    const { pageElement, module, layoutModule } = await processPageRoute(
      route,
      error,
    );

    const middlewareResponseHeaders =
      middlewareModule?.responseHeaders?.(req, status) ?? {};

    const layoutResponseHeaders =
      layoutModule?.responseHeaders?.(req, status) ?? {};

    const pageResponseHeaders = module.responseHeaders?.(req, status) ?? {};
    const htmlStream = renderToReadableStream(pageElement, {
      request: req,
      head: module.Head,
    });

    const responseOptions = {
      headers: {
        "cache-control": CACHE_CONTROL,
        ...middlewareResponseHeaders,
        ...layoutResponseHeaders,
        ...pageResponseHeaders,
        "transfer-encoding": "chunked",
        vary: "Accept-Encoding",
        "content-type": "text/html; charset=utf-8",
      },
      status,
    };

    return new Response(htmlStream, responseOptions);
  }

  function error404(req: RequestContext) {
    if (!route404) {
      return new Response("Not found", {
        status: 404,
        headers: { "cache-control": CACHE_CONTROL },
      });
    }

    req.route = route404;

    return responseRenderedPage({ req, route: route404, status: 404 });
  }
}

declare global {
  var sockets: Map<string, ServerWebSocket<unknown>> | undefined;
}
