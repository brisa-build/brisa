import type { MatchedBrisaRoute, RequestContext } from '@/types';
import path from 'node:path';
import fs from 'node:fs';
import renderToReadableStream from '@/utils/render-to-readable-stream';
import { getConstants } from '@/constants';
import transferStoreService from '@/utils/transfer-store-service';
import { RenderInitiator } from '@/public-constants';
import getPageComponentWithHeaders from '@/utils/get-page-component-with-headers';

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
  const { transferClientStoreToServer } = await transferStoreService(req);
  const { PageComponent, pageModule, pageHeaders } =
    await getPageComponentWithHeaders({
      req,
      route,
      error,
      status,
      headers,
    });

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

function getPrerenderedPage(route: MatchedBrisaRoute) {
  const { BUILD_DIR, CONFIG } = getConstants();
  const { pathname } = new URL(route.pathname, 'http://localhost');
  const filePath = path.join(
    BUILD_DIR,
    'prerendered-pages',
    CONFIG.trailingSlash ? `${pathname}/index.html` : `${pathname}.html`,
  );

  return fs.existsSync(filePath) ? Bun.file(filePath).stream() : null;
}
