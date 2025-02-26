/**
 * This handler function is used to handle requests in a Node.js server.
 *
 * Useful if you want to serve your Brisa application with a custom server.
 *
 * Example:
 *
 * ```ts
 * import http from 'node:http';
 * import { handler } from 'brisa/server/node';
 *
 * const server = http.createServer(handler);
 * ```
 *
 * Docs:
 *
 * [Custom Server](https://brisa.build/building-your-application/configuring/custom-server#custom-server)
 */
export function handler(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void>;

/**
 * This serve function is used to start a Node.js server.
 *
 * Useful if you want to serve your Brisa application with a custom server.
 *
 * Example:
 *
 * ```ts
 * import { serve } from 'brisa/server/node';
 *
 * const { port, hostname, server } = serve({ port: 3001 });
 * ```
 *
 * Docs:
 *
 * [Custom Server](https://brisa.build/building-your-application/configuring/custom-server#custom-server)
 */
export function serve({ port }: { port: number }): {
  port: number;
  hostname: string;
  server: ReturnType<typeof https.createServer>;
};
