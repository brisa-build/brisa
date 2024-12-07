import type { ServeOptions } from 'bun';

/**
 * This handler function is used to handle requests in a Deno server.
 *
 * Useful if you want to serve your Brisa application with a custom server.
 *
 * Example:
 *
 * ```ts
 * import { handler } from 'brisa/server/deno';
 *
 * const server = Deno.serve({ port: 3001, handler });
 * ```
 *
 * Docs:
 *
 * [Custom Server](https://brisa.build/building-your-application/configuring/custom-server#custom-server)
 */
export function handler(
  req: Request,
  info: ServeHandlerInfo<Addr>,
): Response | Promise<Response>;

/**
 * This serve function is used to start a Deno server.
 *
 * Useful if you want to serve your Brisa application with a custom server.
 *
 * Example:
 *
 * ```ts
 * import { serve } from 'brisa/server/deno';
 *
 * const { port, hostname, server } = serve({ port: 3001 });
 * ```
 *
 * Docs:
 *
 * [Custom Server](https://brisa.build/building-your-application/configuring/custom-server#custom-server)
 */
export function serve(options: ServeOptions): {
  port: number;
  hostname: string;
  server: ReturnType<typeof Deno.serve>;
};
