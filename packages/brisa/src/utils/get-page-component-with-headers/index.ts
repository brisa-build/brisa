import { getConstants } from '@/constants';
import type { MatchedBrisaRoute, RequestContext } from '@/types';
import importFileIfExists from '@/utils/import-file-if-exists';
import processPageRoute from '@/utils/process-page-route';

type Params = {
  req: RequestContext;
  route: MatchedBrisaRoute;
  status?: number;
  error?: Error;
  headers?: Record<string, string>;
};

export default async function getPageComponentWithHeaders({
  req,
  route,
  error,
  status = 200,
  headers,
}: Params) {
  const { HEADERS, BUILD_DIR } = getConstants();
  const middlewareModule = await importFileIfExists('middleware', BUILD_DIR);
  const { Page, module, layoutModule } = await processPageRoute(route, error);
  const middlewareResponseHeaders =
    middlewareModule?.responseHeaders?.(req, status) ?? {};

  const layoutResponseHeaders =
    layoutModule?.responseHeaders?.(req, status) ?? {};

  const pageResponseHeaders =
    (await module.responseHeaders?.(req, status)) ?? {};

  const pageHeaders = new Headers({
    'cache-control': HEADERS.CACHE_CONTROL,
    ...middlewareResponseHeaders,
    ...layoutResponseHeaders,
    ...pageResponseHeaders,
    ...headers,
    'transfer-encoding': 'chunked',
    vary: 'Accept-Encoding',
    'content-type': 'text/html; charset=utf-8',
  });

  return {
    PageComponent: Page,
    pageModule: module,
    pageHeaders,
  };
}
