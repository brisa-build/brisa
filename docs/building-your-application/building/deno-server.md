---
description: Learn how build a Deno Web Service App in Brisa
---

# Deno Server

Brisa enables starting as a [Deno](https://deno.com/) Server to serve your app by changing the `output` to `deno`. It generates a [Deno](https://deno.com/) server that serves your application on the port 3000 by default, it can be changed with the flag `--port`.

This server is capable of serving your application with all the features that Brisa offers, such as i18n, routing, server actions and middleware.

> [!NOTE]
>
> You need a different `output` type than `bun` since during the build your application is optimized to be served on a Deno server. This means that we use `Deno.serve` and you can use `deno.json` at the root of your project to configure your Deno server and it will be moved inside the build folder.

## Configuration _(Optional)_

To enable a web service application, change the output mode inside [`brisa.config.ts`](/building-your-application/configuring/brisa-config-js):

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";

export default {
  output: "deno",
} satisfies Configuration;
```

After running `brisa build`, Brisa will generate a Deno server that serves your application on the port 3000 by default.

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
> Although you can still use the Bun tooling to start your application in Deno, if you want, you can use `NODE_ENV=production deno build/server.js` to start your application with Deno without Brisa CLI.

## Custom server

If you want to use a custom server, you can follow this guide: [Custom Server](/building-your-application/configuring/custom-server#custom-server).
