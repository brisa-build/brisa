---
description: Get the serve options of Brisa to make a custom server.
---

# `getServeOptions`

## Reference

### `getServeOptions(): Promise<ServeOptions>`

The `getServeOptions` function is used to get the serve options of Brisa to make a [custom server](/building-your-application/configuring/custom-server).

#### Returns:

- A `Promise` that resolves to the Brisa `ServeOptions`.

Example usage:

```tsx 3
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

### Types

`ServeOptions` type are all the options to use with [`Bun.serve`](https://bun.sh/docs/api/http).
