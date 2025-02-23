import type { MatchedBrisaRoute, RequestContext } from '@/types';
import path from 'node:path';
import renderToReadableStream from '@/utils/render-to-readable-stream';
import { getConstants } from '@/constants';
import getPageComponentWithHeaders from '@/utils/get-page-component-with-headers';
import getReadableStreamFromPath from '../get-readable-stream-from-path';

type Params = {
  req: RequestContext;
  route: MatchedBrisaRoute;
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
}: Params) {
  const { PageComponent, pageModule, pageHeaders } =
    await getPageComponentWithHeaders({
      req,
      route,
      error,
      status,
      headers,
    });

  const fileStream = getReadableStreamFromPath(
    routeToPrerenderedPagePath(route),
  );
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

  return new Response(
    htmlStream.pipeThrough(new TextEncoderStream()),
    responseOptions,
  );
}

export function routeToPrerenderedPagePath(route: MatchedBrisaRoute) {
  const { BUILD_DIR, CONFIG } = getConstants();
  const { pathname } = new URL(route.pathname, 'http://localhost');
  const isHome = pathname === '/';
  return path.join(
    BUILD_DIR,
    'prerendered-pages',
    CONFIG.trailingSlash
      ? `${pathname}${path.sep}index.html`
      : `${isHome ? 'index' : pathname}.html`,
  );
}
