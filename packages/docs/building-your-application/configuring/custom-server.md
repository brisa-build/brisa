---
description: Start a Brisa app programmatically using a custom server.
---

# Custom Server

## Bun Custom Server

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

// Necessary for Brisa internals to work well in development
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

By default (without custom server) is:

```json
{
  "scripts": {
    "dev": "brisa dev",
    "build": "brisa build",
    "start": "brisa start"
  }
}
```

> [!WARNING]
>
> If you use a custom server you need to handle [clustering](/building-your-application/configuring/clustering) yourself.

> [!CAUTION]
>
> If you use a different runtime than Bun, like Node.js, you need to handle the WebSockets, HTTP/2, and other features yourself re-using the  `serveOptions`.

## Node.js Custom Server

If you want to use a custom server with Node.js, you can use:

```tsx
import http from "node:http";
import { handler } from "brisa/server/node";

const server = http.createServer(handler).listen(3001);
```

> [!NOTE]
>
> You can use the `serve` function for the same behavior:
> ```tsx
> import { serve } from "brisa/server/node";
>
> const server = serve({ port: 3001 });
> ```

If you want to use a custom handler, you can use the Brisa `handler` function after your custom handler:

```tsx
import http from "node:http";
import { handler } from "brisa/server/node";

const customHandler = (req, res) => {
  res.end("Hello World");
};

const server = http.createServer((req, res) => {
  customHandler(req, res);
  handler(req, res);
}).listen(3001);
```

> [!CAUTION]
>
> If you use a Custom Server you need to handle the WebSockets, HTTP/2, and other features yourself re-using the  `serveOptions`.

To use the `serveOptions` you can use the following:

```tsx
import { getServeOptions } from "brisa/server";

const serveOptions = await getServeOptions();
```

> [!WARNING]
>
> If you use a custom server you need to handle [clustering](/building-your-application/configuring/clustering) yourself.

To run the custom server you'll need to update the `scripts` in `package.json` like so:

:::tabs key:language

==package.json

```json
{
  "scripts": {
    "dev": "brisa build --dev && node server.ts",
    "build": "brisa build",
    "start": "NODE_ENV=production node server.ts"
  }
}
```

:::

By default (without custom server) is:

```json
{
  "scripts": {
    "dev": "brisa dev",
    "build": "brisa build",
    "start": "brisa start"
  }
}
```