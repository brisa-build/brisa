---
description: The serve function is used to start the Deno server and listen for incoming requests.
---

# `serve`

## Reference

### `serve(options: ServeOptions): { port: number; hostname: string; server: ReturnType<typeof Deno.serve>; }`

The `serve` function is used to start the Deno server and listen for incoming requests.

## Example usage:

In the next example, we use the `serve` function to start the Deno server.

```tsx 3-5
import { serve } from "brisa/server/deno";

const { server, port, hostname } = serve({
  port: 3001,
});

console.log(
  "Deno Server ready 🥳",
  `listening on http://${hostname}:${port}...`,
);
```

> [!IMPORTANT]
>
> Keep in mind that the `serve` for Deno is not in `brisa/server` but in `brisa/server/deno`.

> [!CAUTION]
>
> It only makes sense to use it if you need a [custom server](/building-your-application/configuring/custom-server) for extra things from the serve but if you start the server in the same way as Brisa.

## Types

```tsx
export function serve(options: ServeOptions): {
  port: number;
  hostname: string;
  server: ReturnType<typeof Deno.serve>;
};
```
