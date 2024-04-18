---
description: Start a Brisa app programmatically using a custom server.
---

# Custom Server

By default, Brisa includes its own server with `brisa start`. If you have an existing backend, you can still use it with Brisa (this is not a custom server). A custom Brisa server allows you to start a server 100% programmatically in order to use custom server patterns. Most of the time, you will not need this - but it's available for complete customization.

Take a look at the following example of a custom server:

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

> [!NOTE]
>
> See all `Bun.serve` options in [Bun.js docs](https://bun.sh/docs/api/http).

To run the custom server you'll need to update the `scripts` in `package.json` like so:

:::tabs key:language
==package.json

```json
{
  "scripts": {
    "dev": "brisa build --dev && bun server.ts",
    "build": "brisa build",
    "start": "NODE_ENV=production bun server.ts"
  }
}
```

:::
