---
description: The handler function is the user Brisa handler in Deno. You can use it to create a custom server.
---

# `handler`

## Reference

### `handler(req: Request, info: ServeHandlerInfo<Addr>): Response | Promise<Response>`

The `handler` function is the user Brisa handler to handle the incoming requests. You can use it to create a custom server.

## Example usage:

In the next example, we use the `handler` function to use it with `Deno.serve`:

```tsx 5
import { handler } from "brisa/server/deno";

async function customServer(req, info) {
  // Your implementation here ...
  await handler(req, info);
}

const server = Deno.listen({ port: 3000, handler: customServer });
```

## Types

```tsx
export function handler(
  req: Request,
  info: ServeHandlerInfo<Addr>,
): Response | Promise<Response>;
```
