---
description: The handler function is the user Brisa handler to handle the incoming requests. You can use it to create a custom server.
---

# `handler`

## Reference

### `handler(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>`

The `handler` function is the user Brisa handler to handle the incoming requests. You can use it to create a custom server.

## Example usage:

In the next example, we use the `handler` function to create a custom server.

```tsx 6
import http from "node:http";
import { handler } from "brisa/server";

async function customServer(req, res) {
  // Your implementation here ...
  await handler(req, res);
}

const server = http.createServer(customServer).listen(3001);
```

## Types

```tsx
export function handler(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void>;
```