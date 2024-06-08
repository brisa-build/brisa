import type { RequestContext } from "@/types";
import type { MatchedRoute } from "bun";
import path from "node:path";
import fs from "node:fs";
import processPageRoute from "@/utils/process-page-route";
import renderToReadableStream from "@/utils/render-to-readable-stream";
import { getConstants } from "@/constants";
import importFileIfExists from "@/utils/import-file-if-exists";
import transferStoreService from "@/utils/transfer-store-service";
import { RenderInitiator } from "@/public-constants";

type ResponseRenderedPageParams = {
  req: RequestContext;
  route: MatchedRoute;
  status?: number;
  error?: Error;
  headers?: Record<string, string>;
};

export default async function responseRenderedPage({
  req,
  route,
  status = 200,
  error,
  headers = {},
}: ResponseRenderedPageParams) {
  const { transferClientStoreToServer } =
    await transferStoreService(req);
  const { PageComponent, pageModule, pageHeaders } =
    await getPageComponentWithHeaders({ req, route, error, status, headers });

  // Avoid to transfer again if comes from a rerender from an action
  if (req.renderInitiator !== RenderInitiator.SERVER_ACTION) {
    transferClientStoreToServer();
  }

  const fileStream = getPrerenderedPage(route);
  const htmlStream =
    fileStream ??
    renderToReadableStream(PageComponent(), {
      request: req,
      head: pageModule.Head,
    });

  const responseOptions = {
    headers: pageHeaders,
    status,
  };

  return new Response(htmlStream, responseOptions);
}

function getPrerenderedPage(route: MatchedRoute) {
  const { BUILD_DIR, CONFIG } = getConstants();
  const { pathname } = new URL(route.pathname, "http://localhost");
  const filePath = path.join(
    BUILD_DIR,
    "prerendered-pages",
    CONFIG.trailingSlash ? `${pathname}/index.html` : `${pathname}.html`,
  );

  return fs.existsSync(filePath) ? Bun.file(filePath).stream() : null;
}

export async function getPageComponentWithHeaders({
  req,
  route,
  error,
  status = 200,
  headers,
}: ResponseRenderedPageParams) {
  const { HEADERS, BUILD_DIR } = getConstants();
  const middlewareModule = await importFileIfExists("middleware", BUILD_DIR);
  const { Page, module, layoutModule } = await processPageRoute(route, error);
  const middlewareResponseHeaders =
    middlewareModule?.responseHeaders?.(req, status) ?? {};

  const layoutResponseHeaders =
    layoutModule?.responseHeaders?.(req, status) ?? {};

  const pageResponseHeaders =
    (await module.responseHeaders?.(req, status)) ?? {};

  return {
    PageComponent: Page,
    pageModule: module,
    pageHeaders: {
      "cache-control": HEADERS.CACHE_CONTROL,
      ...middlewareResponseHeaders,
      ...layoutResponseHeaders,
      ...pageResponseHeaders,
      ...headers,
      "transfer-encoding": "chunked",
      vary: "Accept-Encoding",
      "content-type": "text/html; charset=utf-8",
    },
  };
}
