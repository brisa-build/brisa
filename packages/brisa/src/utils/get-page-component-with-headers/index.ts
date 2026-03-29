import { getConstants } from '@/constants';
import type { MatchedBrisaRoute, RequestContext } from '@/types';
import importFileIfExists from '@/utils/import-file-if-exists';
import processPageRoute from '@/utils/process-page-route';
import createResponseHeadersContext from '@/utils/create-response-headers-context';

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
  const { HEADERS, MODULES } = getConstants();
  const middleware = MODULES?.middleware;
  const { Page, module, layoutModule } = await processPageRoute(route, error);
  let pageHeaders = new Headers({
    'cache-control': HEADERS.CACHE_CONTROL,
    ...headers,
    'transfer-encoding': 'chunked',
    vary: 'Accept-Encoding',
    'content-type': 'text/html; charset=utf-8',
  });

  const middlewareResponseHeaders = await middleware?.responseHeaders?.(
    req,
    createResponseHeadersContext(pageHeaders, status),
  );

  if (middlewareResponseHeaders) pageHeaders = middlewareResponseHeaders;

  const layoutResponseHeaders = await layoutModule?.responseHeaders?.(
    req,
    createResponseHeadersContext(pageHeaders, status),
  );

  if (layoutResponseHeaders) pageHeaders = layoutResponseHeaders;

  const pageResponseHeaders = await module.responseHeaders?.(
    req,
    createResponseHeadersContext(pageHeaders, status),
  );

  if (pageResponseHeaders) pageHeaders = pageResponseHeaders;

  return {
    PageComponent: Page,
    pageModule: module,
    pageHeaders,
  };
}
