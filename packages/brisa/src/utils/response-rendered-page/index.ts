import type { RequestContext } from "@/types";
import type { MatchedRoute } from "bun";
import processPageRoute from "@/utils/process-page-route";
import renderToReadableStream from "@/utils/render-to-readable-stream";
import { getConstants } from "@/constants";
import importFileIfExists from "@/utils/import-file-if-exists";
import transferStoreService from "@/utils/transfer-store-service";

export default async function responseRenderedPage({
  req,
  route,
  status = 200,
  error,
  headers = {},
}: {
  req: RequestContext;
  route: MatchedRoute;
  status?: number;
  error?: Error;
  headers?: Record<string, string>;
}) {
  const { transfeClientStoreToServer, transferServerStoreToClient } =
    transferStoreService(req);
  const { HEADERS, BUILD_DIR } = getConstants();
  const middlewareModule = await importFileIfExists("middleware", BUILD_DIR);
  const { pageElement, module, layoutModule } = await processPageRoute(
    route,
    error,
  );

  transfeClientStoreToServer();

  const middlewareResponseHeaders =
    middlewareModule?.responseHeaders?.(req, status) ?? {};

  const layoutResponseHeaders =
    layoutModule?.responseHeaders?.(req, status) ?? {};

  const pageResponseHeaders =
    (await module.responseHeaders?.(req, status)) ?? {};
  const htmlStream = renderToReadableStream(pageElement, {
    request: req,
    head: module.Head,
  });

  const responseOptions = {
    headers: {
      "cache-control": HEADERS.CACHE_CONTROL,
      ...middlewareResponseHeaders,
      ...layoutResponseHeaders,
      ...pageResponseHeaders,
      ...headers,
      "transfer-encoding": "chunked",
      vary: "Accept-Encoding",
      "content-type": "text/html; charset=utf-8",
    },
    status,
  };

  const res = new Response(htmlStream, responseOptions);

  transferServerStoreToClient(res);

  return res;
}
