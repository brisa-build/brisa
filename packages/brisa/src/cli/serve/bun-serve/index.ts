import constants from '@/constants';
import type { ServeOptions } from 'bun';

export default function serve(options: ServeOptions) {
  console.log(constants.LOG_PREFIX.INFO, `• Runtime: Bun.js ${Bun.version}`);
  const server = Bun.serve(options);
  globalThis.brisaServer = server;

  return { port: server.port, hostname: server.hostname, server };
}
