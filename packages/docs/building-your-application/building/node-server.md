---
description: Learn how build a Node.js Web Service App in Brisa
---

# Node.js Server

Brisa enables starting as a [Node.js](https://nodejs.org/en/) Server to serve your app by changing the `output` to `node`. It generates a Node.js server that serves your application on the port 3000 by default, it can be changed with the flag `--port`.

This server is capable of serving your application with all the features that Brisa offers, such as i18n, routing, server actions and middleware.

> [!NOTE]
>
> You need a different `output` type than `bun` since during the build your application is optimized to be served on a Node.js server.

## Configuration _(Optional)_

To enable a web service application, change the output mode inside [`brisa.config.ts`](/building-your-application/configuring/brisa-config-js):

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";

export default {
  output: "node",
} satisfies Configuration;
```

After running `brisa build`, Brisa will generate a Node.js server that serves your application on the port 3000 by default.

## Changing the port

To change the port, you can use the flag `--port`:

```sh
brisa start --port 8080
```

> [!NOTE]
>
> The default port is `process.env.PORT` or `3000`.

After running `brisa build`, Brisa will generate a Bun server that serves your application on the port 8080.

> [!TIP]
>
> Although you can still use the Bun tooling to start your application in Node.js, if you want, you can use `node build/server.js` to start your application with Node.js.

## Custom server

If you want to use a custom server, you can follow this guide: [Custom Server](/building-your-application/configuring/custom-server#custom-server).
