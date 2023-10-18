import fs from "node:fs";
import path from "node:path";

import LoadLayout from "../../utils/load-layout";
import extendRequestContext from "../../utils/extend-request-context";
import getConstants from "../../constants";
import getImportableFilepath from "../../utils/get-importable-filepath";
import getRouteMatcher from "../../utils/get-route-matcher";
import handleI18n from "../../utils/handle-i18n";
import importFileIfExists from "../../utils/import-file-if-exists";
import redirectTrailingSlash from "../../utils/redirect-trailing-slash";
import { LiveReloadScript } from "../dev-live-reload";
import { MatchedRoute, ServeOptions, ServerWebSocket } from "bun";
import { RequestContext } from "../../types";
import { renderToReadableStream } from "../../core";

const {
  IS_PRODUCTION,
  PAGE_404,
  PAGE_500,
  RESERVED_PAGES,
  BUILD_DIR,
  PORT,
  PAGES_DIR,
  ASSETS_DIR,
} = getConstants();

let pagesRouter = getRouteMatcher(PAGES_DIR, RESERVED_PAGES);
let rootRouter = getRouteMatcher(BUILD_DIR);

const HOT_RELOAD_TOPIC = "hot-reload";
const WEBSOCKET_PATH = getImportableFilepath("websocket", BUILD_DIR);
const wsModule = WEBSOCKET_PATH ? await import(WEBSOCKET_PATH) : null;
const route404 = pagesRouter.reservedRoutes[PAGE_404];
const middlewareModule = await importFileIfExists("middleware", BUILD_DIR);
const customMiddleware = middlewareModule?.default;

const responseInitWithGzip = {
  headers: {
    "content-encoding": "gzip",
    vary: "Accept-Encoding",
  },
};

// Options to start server
export const serveOptions: ServeOptions = {
  port: PORT,
  development: !IS_PRODUCTION,
  async fetch(req: Request, server) {
    const requestId = crypto.randomUUID();

    if (server.upgrade(req, { data: { id: requestId } })) return;

    const request = extendRequestContext({
      originalRequest: req,
      id: requestId,
    });
    const url = new URL(request.finalURL);
    const assetPath = path.join(ASSETS_DIR, url.pathname);
    const isHome = url.pathname === "/";
    const isAnAsset = !isHome && fs.existsSync(assetPath);
    const i18nRes = isAnAsset ? {} : handleI18n(request);

    const isValidRoute = () => {
      return (
        pagesRouter.match(request).route || rootRouter.match(request).route
      );
    };

    // 404 page
    const error404 = () =>
      route404
        ? responseRenderedPage({ req: request, route: route404, status: 404 })
        : new Response("Not found", { status: 404 });

    if (i18nRes.response) {
      return isValidRoute() ? i18nRes.response : error404();
    }

    if (i18nRes.pagesRouter && i18nRes.rootRouter) {
      pagesRouter = i18nRes.pagesRouter;
      rootRouter = i18nRes.rootRouter;
    }

    if (!isAnAsset) {
      const redirect = redirectTrailingSlash(request);

      if (redirect) return isValidRoute() ? redirect : error404();
    }

    request.getIP = () => server.requestIP(req);

    return (
      handleRequest(request, isAnAsset)
        // 500 page
        .catch((error) => {
          const route500 = pagesRouter.reservedRoutes[PAGE_500];
          if (!route500) throw error;
          return responseRenderedPage({
            req: request,
            route: route500,
            status: 500,
            error,
          });
        })
    );
  },
  websocket: {
    open: (ws: ServerWebSocket<{ id: string }>) => {
      if (!globalThis.sockets) globalThis.sockets = new Map();
      globalThis.sockets.set(ws.data.id, ws);
      if (!IS_PRODUCTION) ws.subscribe(HOT_RELOAD_TOPIC);
      wsModule?.open?.(ws);
    },
    close: (ws: ServerWebSocket<{ id: string }>) => {
      globalThis.sockets?.delete?.(ws.data.id);
      if (!IS_PRODUCTION) ws.unsubscribe(HOT_RELOAD_TOPIC);
      wsModule?.close?.(ws);
    },
    message: (ws: ServerWebSocket<{ id: string }>, message: string) => {
      wsModule?.message?.(ws, message);
    },
    drain: (ws: ServerWebSocket<{ id: string }>) => {
      wsModule?.drain?.(ws);
    },
  },
};

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

  req.route = isApi ? api?.route : route;

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
    const isGzip = req.headers.get("accept-encoding")?.includes?.("gzip");
    const file = Bun.file(isGzip ? `${assetPath}.gz` : assetPath);
    const responseOptions = isGzip ? responseInitWithGzip : {};

    return new Response(file, responseOptions);
  }

  // 404 page
  return route404
    ? responseRenderedPage({ req, route: route404, status: 404 })
    : new Response("Not found", { status: 404 });
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
  const module = await import(route.filePath);
  const PageComponent = module.default;
  const layoutPath = getImportableFilepath("layout", BUILD_DIR);
  const layoutModule = layoutPath ? await import(layoutPath) : undefined;

  const pageElement = (
    <PageLayout layoutModule={layoutModule}>
      <PageComponent error={error} />
    </PageLayout>
  );

  const middlewareResponseHeaders =
    middlewareModule?.responseHeaders?.(req, status) ?? {};
  const layoutResponseHeaders =
    layoutModule?.responseHeaders?.(req, status) ?? {};
  const pageResponseHeaders = module.responseHeaders?.(req, status) ?? {};
  const htmlStream = renderToReadableStream(pageElement, req, module.Head);
  const responseOptions = {
    headers: {
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

function PageLayout({
  children,
  layoutModule,
}: {
  children: JSX.Element;
  layoutModule?: { default: (props: { children: JSX.Element }) => JSX.Element };
}) {
  const childrenWithLiveReload = IS_PRODUCTION ? (
    children
  ) : (
    <LiveReloadScript port={PORT}>{children}</LiveReloadScript>
  );

  return (
    <LoadLayout layoutModule={layoutModule}>
      {childrenWithLiveReload}
    </LoadLayout>
  );
}

declare global {
  var sockets: Map<string, ServerWebSocket<unknown>> | undefined;
}
