import fs from "node:fs";
import path from "node:path";

import LoadLayout from "../utils/load-layout";
import getRouteMatcher from "../utils/get-route-matcher";
import { BunriseRequest, renderToReadableStream } from "../bunrise";
import { LiveReloadScript } from "./dev-live-reload";
import { MatchedRoute, ServerWebSocket } from "bun";
import importFileIfExists from "../utils/import-file-if-exists";
import getConstants from '../constants'
import handleI18n from "../utils/handle-i18n";

const { IS_PRODUCTION, PAGE_404, PAGE_500, RESERVED_PAGES, ROOT_DIR, PORT, PAGES_DIR, ASSETS_DIR } = getConstants();

declare global {
  var ws: ServerWebSocket<unknown> | undefined;
}

if (IS_PRODUCTION && !fs.existsSync(ROOT_DIR)) {
  console.error('Not exist "build" yet. Please run "bunrise build" first');
  process.exit(1);
}

if (!fs.existsSync(PAGES_DIR)) {
  const path = IS_PRODUCTION ? "build/pages" : "src/pages";
  const cli = IS_PRODUCTION ? "bunrise start" : "bunrise dev";

  console.error(`Not exist ${path}" directory. It\'s required to run "${cli}"`);
  process.exit(1);
}

const customMiddleware = await importFileIfExists("middleware");
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
    const request = new BunriseRequest(req);
    const i18nRes = handleI18n(request);

    if (i18nRes.response) return i18nRes.response;
    if (i18nRes.pagesRouter && i18nRes.rootRouter) {
      pagesRouter = i18nRes.pagesRouter;
      rootRouter = i18nRes.rootRouter;
    }

    return (
      handleRequest(request)
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
    },
    close: () => {
      globalThis.ws = undefined;
    },
    message: () => {
      /* void */
    },
  },
});

console.log(
  `Listening on http://localhost:${port} (${process.env.NODE_ENV})...`,
);

///////////////////////////////////////////////////////
////////////////////// HELPERS ///////////////////////
///////////////////////////////////////////////////////

async function handleRequest(req: BunriseRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const { route, isReservedPathname } = pagesRouter.match(req);
  const isApi = pathname.startsWith("/api/");
  const api = isApi ? rootRouter.match(req) : null;
  const assetPath = path.join(ASSETS_DIR, pathname);

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

  // Assets
  if (fs.existsSync(assetPath)) {
    const isGzip =
      IS_PRODUCTION && req.headers.get("accept-encoding")?.includes?.("gzip");

    const file = Bun.file(isGzip ? `${assetPath}.gz` : assetPath);
    const responseOptions = isGzip ? responseInitWithGzip : {};

    return new Response(file, responseOptions);
  }

  // API
  if (isApi && api?.route && !api?.isReservedPathname) {
    const module = await import(api.route.filePath);
    const method = req.method.toLowerCase();

    req.route = api.route;

    return module[method]?.(req);
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
  req: BunriseRequest;
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

  const htmlStream = await renderToReadableStream(pageElement, req);
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
