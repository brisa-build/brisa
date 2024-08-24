import type { MatchedBrisaRoute, RequestContext } from '@/types';
import path from 'node:path';
import fs from 'node:fs';
import { pipeline } from 'node:stream';
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

const isBunRuntime = typeof Bun !== 'undefined';

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
    CONFIG.trailingSlash
      ? `${pathname}${path.sep}index.html`
      : `${pathname}.html`,
  );

  return getReadableStreamFromPath(filePath);
}

function getReadableStreamFromPath(filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  if (isBunRuntime) {
    return Bun.file(filePath).stream();
  }
  const readStream = fs.createReadStream(filePath);

  return new ReadableStream({
    start(controller) {
      pipeline(
        readStream,
        async function* (source) {
          for await (const chunk of source) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
        (err) => {
          if (err) {
            controller.error(err);
          }
        },
      );
    },
  });
}
