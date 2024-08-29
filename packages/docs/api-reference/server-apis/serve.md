---
description: The serve function is used to start the Bun.js server and listen for incoming requests.
---

# `serve`

## Reference

### `serve(options: ServeOptions): { port: number; hostname: string; server: Server; }`

The `serve` function is used to start the Bun.js server and listen for incoming requests.

## Example usage:

In the next example, we use the `serve` function to start the Bun.js server.

```tsx 5-14
import { getServeOptions, serve } from "brisa/server";

const serveOptions = await getServeOptions();

const { server, port, hostname } = serve({
  ...serveOptions,
  fetch(req, server) {
    // Your implementation here ...

    // Brisa handler
    return serveOptions.fetch(req, server);
  },
  port: 3001,
});

console.log(
  "Server ready 🥳",
  `listening on http://${hostname}:${port}...`,
);
```

> [!CAUTION]
>
> It only makes sense to use it if you need a [custom server](/building-your-application/configuring/custom-server) for extra things from the serve but if you start the server in the same way as Brisa.

## Types

```tsx
export function serve(options: ServeOptions): {
  port: number;
  hostname: string;
  server: Server; // Bun.js server (Bun.serve)
};
```
