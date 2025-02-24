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

const { HEADERS, BUILD_DIR } = getConstants();
const middlewareModule = await importFileIfExists('middleware', BUILD_DIR);

export default async function getPageComponentWithHeaders({
  req,
  route,
  error,
  status = 200,
  headers,
}: Params) {
  const { Page, module, layoutModule } = await processPageRoute(route, error);
  let pageHeaders = new Headers({
    'cache-control': HEADERS.CACHE_CONTROL,
    ...headers,
    'transfer-encoding': 'chunked',
    vary: 'Accept-Encoding',
    'content-type': 'text/html; charset=utf-8',
  });

  const middlewareResponseHeaders = await middlewareModule?.responseHeaders?.(
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
