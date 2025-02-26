import type { ServeOptions } from 'bun';

export default function serve(options: ServeOptions) {
  const server = Bun.serve(options);
  globalThis.brisaServer = server;

  return { port: server.port, hostname: server.hostname, server };
}
