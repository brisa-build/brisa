import fs from "node:fs";
import path from "node:path";

import LoadLayout from "../utils/load-layout";
import getRouteMatcher from "../utils/get-route-matcher";
import { RequestContext, renderToReadableStream } from "../brisa";
import { LiveReloadScript } from "./dev-live-reload";
import { MatchedRoute, ServerWebSocket } from "bun";
import importFileIfExists from "../utils/import-file-if-exists";
import getConstants from "../constants";
import handleI18n from "../utils/handle-i18n";
import redirectTrailingSlash from "../utils/redirect-trailing-slash";
import getImportableFilepath from "../utils/get-importable-filepath";

const {
  IS_PRODUCTION,
  PAGE_404,
  PAGE_500,
  RESERVED_PAGES,
  ROOT_DIR,
  PORT,
  PAGES_DIR,
  ASSETS_DIR,
} = getConstants();

const WEBSOCKET_PATH = getImportableFilepath("websocket", ROOT_DIR);
const wsModule = WEBSOCKET_PATH ? await import(WEBSOCKET_PATH) : null

declare global {
  var ws: ServerWebSocket<unknown> | undefined;
}

if (IS_PRODUCTION && !fs.existsSync(ROOT_DIR)) {
  console.error('Not exist "build" yet. Please run "brisa build" first');
  process.exit(1);
}

if (!fs.existsSync(PAGES_DIR)) {
  const path = IS_PRODUCTION ? "build/pages" : "src/pages";
  const cli = IS_PRODUCTION ? "brisa start" : "brisa dev";

  console.error(`Not exist ${path}" directory. It\'s required to run "${cli}"`);
  process.exit(1);
}

const customMiddleware = await importFileIfExists("middleware", ROOT_DIR);
let pagesRouter = getRouteMatcher(PAGES_DIR, RESERVED_PAGES);
let rootRouter = getRouteMatcher(ROOT_DIR);

const responseInitWithGzip = {
  headers: {
    "content-encoding": "gzip",
    vary: "Accept-Encoding",
  },
};

// Start server
Bun.serve({
  port: PORT,
  development: !IS_PRODUCTION,
  async fetch(req: Request, server) {
    if (server.upgrade(req)) return;
    const request = new RequestContext(req);
    const url = new URL(request.url);
    const assetPath = path.join(ASSETS_DIR, url.pathname);
    const isHome = url.pathname === "/";
    const isAnAsset = !isHome && fs.existsSync(assetPath);
    const i18nRes = isAnAsset ? {} : handleI18n(request);

    if (i18nRes.response) return i18nRes.response;
    if (i18nRes.pagesRouter && i18nRes.rootRouter) {
      pagesRouter = i18nRes.pagesRouter;
      rootRouter = i18nRes.rootRouter;
    }

    if (!isAnAsset) {
      const redirect = redirectTrailingSlash(request);
      if (redirect) return redirect;
    }

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
    open: (ws: ServerWebSocket<unknown>) => {
      globalThis.ws = ws;
      wsModule?.open?.(ws);
    },
    close: (...args) => {
      globalThis.ws = undefined;
      wsModule?.close?.(...args);
    },
    message: (ws, message) => {
      wsModule?.message?.(ws, message);
    },
    drain: (ws) => {
      wsModule?.drain?.(ws);
    }
  },
});

console.log(
  `Listening on http://localhost:${PORT} (${process.env.NODE_ENV})...`,
);

///////////////////////////////////////////////////////
////////////////////// HELPERS ///////////////////////
///////////////////////////////////////////////////////

async function handleRequest(req: RequestContext, isAnAsset: boolean) {
  const locale = req.i18n?.locale;
  const url = new URL(req.url);
  const pathname = url.pathname;
  const { route, isReservedPathname } = pagesRouter.match(req);
  const isApi = pathname.startsWith(locale ? `/${locale}/api/` : "/api/");
  const api = isApi ? rootRouter.match(req) : null;

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
    const method = req.method.toLowerCase();

    req.route = api.route;

    return module[method]?.(req);
  }

  // Assets
  if (isAnAsset) {
    const assetPath = path.join(ASSETS_DIR, url.pathname);
    const isGzip =
      IS_PRODUCTION && req.headers.get("accept-encoding")?.includes?.("gzip");

    const file = Bun.file(isGzip ? `${assetPath}.gz` : assetPath);
    const responseOptions = isGzip ? responseInitWithGzip : {};

    return new Response(file, responseOptions);
  }

  // 404 page
  const route404 = pagesRouter.reservedRoutes[PAGE_404];

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

  req.route = route;

  const pageElement = (
    <PageLayout>
      <PageComponent error={error} />
    </PageLayout>
  );

  const htmlStream = renderToReadableStream(pageElement, req, module.Head);
  const responseOptions = {
    headers: {
      "transfer-encoding": "chunked",
      vary: "Accept-Encoding",
      "content-type": "text/html; charset=utf-8",
    },
    status,
  };

  return new Response(htmlStream, responseOptions);
}

function PageLayout({ children }: { children: JSX.Element }) {
  const childrenWithLiveReload = IS_PRODUCTION ? (
    children
  ) : (
    <LiveReloadScript port={PORT}>{children}</LiveReloadScript>
  );

  return <LoadLayout>{childrenWithLiveReload}</LoadLayout>;
}
