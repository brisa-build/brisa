import https from 'node:https';
import http from 'node:http';
import handler from './handler';
import constants, { getConstants } from '@/constants';
import type { NodeTLSOptions } from '@/types';

export default async function serve(
  { port = constants.PORT } = { port: constants.PORT },
) {
  const tlsOptions = getConstants().CONFIG?.tls as NodeTLSOptions;
  const server = tlsOptions
    ? https.createServer(tlsOptions, handler)
    : http.createServer(handler);

  server.listen(port);

  return { server, port, hostname: 'localhost' };
}
