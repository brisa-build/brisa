---
description: Get the serve options of Brisa to make a custom server.
---

# getServeOptions

## Reference

### `getServeOptions(): Promise<ServeOptions>`

The `getServeOptions` function is used to get the serve options of Brisa to make a [custom server](/building-your-application/configuring/custom-server).

#### Returns:

- A `Promise` that resolves to the Brisa `ServeOptions`.

Example usage:

```tsx
import { getServeOptions } from "brisa/server";

const serveOptions = await getServeOptions();

// See Bun.js serve options: https://bun.sh/docs/api/http
const server = Bun.serve({
  ...serveOptions,
  port: 3001,
});

// Necessary for Brisa internals
globalThis.brisaServer = server;

console.log(
  "Server ready 🥳",
  `listening on http://${server.hostname}:${server.port}...`,
);
```

### Types

`ServeOptions` type are all the options to use with [`Bun.serve`](https://bun.sh/docs/api/http).
