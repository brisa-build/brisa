import type { ServeOptions, TLSOptions } from 'bun';
import { getServeOptions } from '../serve-options';

const serveOptions = await getServeOptions();

export default function serve(options: ServeOptions & { tls?: TLSOptions }) {
  // @ts-ignore
  const server = Deno.serve({
    port: options.port,
    hostname: options.hostname,
    cert: options.tls?.cert,
    key: options.tls?.key,
    responseWriteTimeout: options.idleTimeout,
    handler,
  });

  globalThis.brisaServer = server;

  return { port: server.addr.port, hostname: server.addr.hostname, server };
}

export async function handler(req: Request, connInfo: any) {
  const bunServer = {
    upgrade: () => {},
    requestIP: () => connInfo.remoteAddr,
  } as any;

  const res = await serveOptions.fetch.call(bunServer, req, bunServer);

  if (!res) {
    return new Response('Not Found', { status: 404 });
  }

  return res;
}
