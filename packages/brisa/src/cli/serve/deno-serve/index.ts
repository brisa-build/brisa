import type { ServeOptions, TLSOptions } from 'bun';

export default function serve({
  fetch,
  ...options
}: ServeOptions & { tls?: TLSOptions }) {
  // @ts-ignore
  const server = Deno.serve({
    port: options.port,
    hostname: options.hostname,
    cert: options.tls?.cert,
    key: options.tls?.key,
    handler: async (req: Request, connInfo: any) => {
      const bunServer = {
        upgrade: () => {},
        requestIP: () => connInfo.remoteAddr,
      } as any;

      const res = await fetch.call(bunServer, req, bunServer);

      if (!res) {
        return new Response('Not Found', { status: 404 });
      }

      return res;
    },
  });

  globalThis.brisaServer = server;

  return { port: server.addr.port, hostname: server.addr.hostname, server };
}
