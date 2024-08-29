---
description: The serve function is used to start the Node.js server and listen for incoming requests.
---

# `serve`

## Reference

### `serve({ port }: { port: number }): { port: number; hostname: string; server: ReturnType<typeof http.createServer>; }`

The `serve` function is used to start the Node.js server and listen for incoming requests.

## Example usage:

In the next example, we use the `serve` function to start the Node.js server.

```tsx 3-5
import { serve } from "brisa/server/node";

const { server, port, hostname } = serve({
  port: 3001,
});

console.log(
  "Node.js Server ready 🥳",
  `listening on http://${hostname}:${port}...`,
);
```

> [!IMPORTANT]
>
> Keep in mind that the `serve` for Node.js is not in `brisa/server` but in `brisa/server/node`.

> [!CAUTION]
>
> It only makes sense to use it if you need a [custom server](/building-your-application/configuring/custom-server) for extra things from the serve but if you start the server in the same way as Brisa.

## Types

```tsx
export function serve({ port }: { port: number }): {
  port: number;
  hostname: string;
  server: ReturnType<typeof http.createServer>;
};
```
