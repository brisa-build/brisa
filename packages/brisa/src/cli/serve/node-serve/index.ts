import https from 'node:https';
import http from 'node:http';
import handler from './handler';
import constants, { getConstants } from '@/constants';
import type { NodeTLSOptions } from '@/types';
import { logError } from '@/utils/log/log-build';

export default async function serve(
  { port = constants.PORT } = { port: constants.PORT },
) {
  const config = getConstants().CONFIG;
  const tlsOptions = config?.tls as NodeTLSOptions;
  const server = tlsOptions
    ? https.createServer(tlsOptions, handler)
    : http.createServer(handler);

  if (tlsOptions && (!tlsOptions.key || !tlsOptions.cert)) {
    logError({
      messages: ['Missing key or certificate in TLS configuration.'],
    });
  }

  server.timeout = config?.idleTimeout || 30;
  server.listen(port);
  server.on('error', (error) => {
    const protocol = tlsOptions ? 'https' : 'http';
    logError({
      messages: [
        `Error starting ${protocol} server in Node.js:`,
        error.message,
      ],
      stack: error.stack,
    });
  });

  return { server, port, hostname: 'localhost' };
}
