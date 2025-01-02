import type http from 'node:http';
import { getServeOptions } from '@/cli/serve/serve-options';
import splitCookiesString from '@/utils/split-cookies-string';

// Init polyfills for Node prior to 22.x
import './polyfills';

const serveOptions = await getServeOptions();

export default async function handler(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  const bunServer = {
    upgrade: () => {},
    requestIP: () => req.socket.remoteAddress,
  } as any;
  const base = `${req.headers['x-forwarded-proto'] ?? 'http'}://${req.headers.host}`;
  const request = await getRequest({ request: req, base });
  const response = await serveOptions!.fetch.call(
    bunServer,
    request,
    bunServer,
  );

  await setResponse(res, response!);
}

/*
  Credits to the SvelteKit team
	https://github.com/sveltejs/kit/blob/8d1ba04825a540324bc003e85f36559a594aadc2/packages/kit/src/exports/node/index.js
*/
function get_raw_body(req: http.IncomingMessage) {
  const h = req.headers;

  if (!h['content-type']) {
    return null;
  }

  const content_length = Number(h['content-length']);

  // check if no request body
  if (
    (req.httpVersionMajor === 1 &&
      isNaN(content_length) &&
      h['transfer-encoding'] == null) ||
    content_length === 0
  ) {
    return null;
  }

  if (req.destroyed) {
    const readable = new ReadableStream();
    readable.cancel();
    return readable;
  }

  let cancelled = false;

  return new ReadableStream({
    start(controller) {
      req.on('error', (error) => {
        cancelled = true;
        controller.error(error);
      });

      req.on('end', () => {
        if (cancelled) return;
        controller.close();
      });

      req.on('data', (chunk) => {
        if (cancelled) return;

        controller.enqueue(chunk);

        if (controller.desiredSize === null || controller.desiredSize <= 0) {
          req.pause();
        }
      });
    },

    pull() {
      req.resume();
    },

    cancel(reason) {
      cancelled = true;
      req.destroy(reason);
    },
  });
}

export async function getRequest({
  request,
  base,
}: { request: http.IncomingMessage; base: string }) {
  return new Request(base + request.url, {
    duplex: 'half',
    method: request.method,
    // @ts-ignore
    headers: request.headers,
    body: get_raw_body(request),
  });
}

export async function setResponse(
  res: http.ServerResponse,
  response: Response,
) {
  for (const [key, value] of response.headers) {
    try {
      res.setHeader(
        key,
        key === 'set-cookie' ? splitCookiesString(value) : value,
      );
    } catch (error) {
      console.log({ error });
      res.getHeaderNames().forEach((name) => res.removeHeader(name));
      res.writeHead(500).end(String(error));
      return;
    }
  }

  res.writeHead(response.status);

  if (!response.body) {
    res.end();
    return;
  }

  if (response.body.locked) {
    res.write(
      'Fatal error: Response body is locked. ' +
        `This can happen when the response was already read (for example through 'response.json()' or 'response.text()').`,
    );
    res.end();
    return;
  }

  const reader = response.body.getReader();

  if (res.destroyed) {
    reader.cancel();
    return;
  }

  const cancel = (error?: Error) => {
    res.off('close', cancel);
    res.off('error', cancel);

    // If the reader has already been interrupted with an error earlier,
    // then it will appear here, it is useless, but it needs to be catch.
    reader.cancel(error).catch(() => {});
    if (error) res.destroy(error);
  };

  res.on('close', cancel);
  res.on('error', cancel);

  next();
  async function next() {
    // interval to keep alive the stream connection
    const interval = setInterval(() => {
      res.write(Buffer.from(''));
    }, 10);

    try {
      for (;;) {
        const { done, value } = await reader.read();

        if (done) break;

        if (!res.write(value)) {
          res.once('drain', next);
          return;
        }
      }
      clearInterval(interval);
      res.end();
    } catch (error) {
      clearInterval(interval);
      cancel(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
