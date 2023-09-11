import fs from "node:fs";
import path from "node:path";

import getRootDir from "../utils/get-root-dir";
import getRouteMatcher from "../utils/get-route-matcher";
import { BunriseRequest, renderToReadableStream } from "../bunrise";
import { MatchedRoute, ServerWebSocket } from "bun";

declare global {
  var ws: ServerWebSocket<unknown> | undefined;
}

const LIVE_RELOAD_WEBSOCKET_PATH = "__bunrise_live_reload__";
const LIVE_RELOAD_COMMAND = "reload";
const PAGE_404 = "/_404";
const PAGE_500 = "/_500";
const RESERVED_PAGES = [PAGE_404, PAGE_500];
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (!IS_PRODUCTION) {
  // Enable live reload
  globalThis.ws?.send?.(LIVE_RELOAD_COMMAND);
}

const port = parseInt(process.argv[2]) || 3000;
const projectDir = getRootDir();
const srcDir = path.join(projectDir, "src");
const buildDir = path.join(projectDir, "build");
const rootDir = IS_PRODUCTION ? buildDir : srcDir;
const assetsDir = path.join(rootDir, "public");
const pagesDir = path.join(rootDir, "pages");

if (IS_PRODUCTION && !fs.existsSync(buildDir)) {
  console.error('Not exist "build" yet. Please run "bunrise build" first');
  process.exit(1);
}

if (!fs.existsSync(pagesDir)) {
  const path = IS_PRODUCTION ? "build/pages" : "src/pages";
  const cli = IS_PRODUCTION ? "bunrise start" : "bunrise dev";

  console.error(`Not exist ${path}" directory. It\'s required to run "${cli}"`);
  process.exit(1);
}

const pagesRouter = getRouteMatcher(pagesDir, RESERVED_PAGES);
const rootRouter = getRouteMatcher(rootDir);

const responseInitWithGzip = {
  headers: {
    "content-encoding": "gzip",
    vary: "Accept-Encoding",
  },
};

// Start server
Bun.serve({
  port,
  development: !IS_PRODUCTION,
  async fetch(req: Request) {
    return (
      handleRequest(req)
        // 500 page
        .catch((error) => {
          const route500 = pagesRouter.reservedRoutes[PAGE_500];
          if (!route500) throw error;
          return responseRenderedPage({
            req,
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

async function handleRequest(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const { route, isReservedPathname } = pagesRouter.match(req);
  const isApi = pathname.startsWith("/api/");
  const api = isApi ? rootRouter.match(req) : null;
  const assetPath = path.join(assetsDir, pathname);

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

    return module[method]?.(new BunriseRequest(req, api.route));
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
  req: Request;
  route: MatchedRoute;
  status?: number;
  error?: Error;
}) {
  const module = await import(route.filePath);
  const PageComponent = module.default;
  const bunriseRequest = new BunriseRequest(req, route);

  const pageElement = (
    <Layout>
      <PageComponent error={error} />
    </Layout>
  );

  const htmlStream = await renderToReadableStream(pageElement, bunriseRequest);
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

function Layout({ children }: { children: JSX.Element }) {
  const childrenWithLiveReload = IS_PRODUCTION ? (
    children
  ) : (
    <LiveReloadScript>{children}</LiveReloadScript>
  );

  return (
    <html>
      <head>
        <title>Bunrise</title>
      </head>
      <body>{childrenWithLiveReload}</body>
    </html>
  );
}

function LiveReloadScript({ children }: { children: JSX.Element }) {
  const wsUrl = `ws://0.0.0.0:${port}/${LIVE_RELOAD_WEBSOCKET_PATH}`;

  return (
    <>
      <script>
        {`
        const socket = new WebSocket("${wsUrl}");
        socket.onmessage = evt => {
          if (evt.data === "${LIVE_RELOAD_COMMAND}") {
            location.reload();
          }
        }`}
      </script>
      {children}
    </>
  );
}
