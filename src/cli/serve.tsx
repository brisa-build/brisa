import fs from "node:fs";
import path from "node:path";

import getRootDir from "../utils/get-root-dir";
import getRouteMatcher from "../utils/get-route-matcher";
import { BunriseRequest, renderToReadableStream } from "../bunrise";
import { JSXElement } from "../types";
import { enableLiveReload } from "./dev-live-reload";
import { MatchedRoute } from "bun";

const PAGE_404 = "/_404";
const PAGE_500 = "/_500";
const RESERVED_PAGES = [PAGE_404, PAGE_500];

const isProduction = process.env.NODE_ENV === "production";
const projectDir = getRootDir();
const srcDir = path.join(projectDir, "src");
const buildDir = path.join(projectDir, "build");
const rootDir = isProduction ? buildDir : srcDir;
const assetsDir = path.join(rootDir, "public");
const pagesDir = path.join(rootDir, "pages");

if (isProduction && !fs.existsSync(buildDir)) {
  console.error('Not exist "build" yet. Please run "bunrise build" first');
  process.exit(1);
}

if (!fs.existsSync(pagesDir)) {
  const path = isProduction ? "build/pages" : "src/pages";
  const cli = isProduction ? "bunrise start" : "bunrise dev";

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
  const pageElement = (<PageComponent error={error} />) as JSXElement;
  const bunriseRequest = new BunriseRequest(req, route);
  const htmlStream = await renderToReadableStream(pageElement, bunriseRequest);
  const responseOptions = {
    headers: {
      "transfer-encoding": "chunked",
      "vary": "Accept-Encoding",
      "content-type": "text/html; charset=utf-8",
    },
    status,
  };

  return new Response(htmlStream, responseOptions);
}

export default async function handleRequest(req: Request) {
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
      isProduction && req.headers.get("accept-encoding")?.includes?.("gzip");

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

async function fetch(req: Request) {
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
}

const serverOptions = isProduction
  ? { port: 3000, fetch, development: false }
  : enableLiveReload({ port: 3000, fetch });

const server = Bun.serve(serverOptions);

console.log(
  `Listening on http://localhost:${server.port} (${process.env.NODE_ENV})...`,
);
