---
description: Learn how build a Bun.js Web Service App in Brisa
---

# Bun Server

Brisa by default is a [Bun.js](https://bun.sh/) web service application. This means that when you run `brisa build`, Brisa generates a Bun server that serves your application on the port 3000 by default, it can be changed with the flag `--port`.

This server is capable of serving your application with all the features that Brisa offers, such as i18n, routing, server actions and middleware.

## Configuration _(Optional)_

To enable a web service application, change the output mode inside [`brisa.config.ts`](/building-your-application/configuring/brisa-config-js) _(optional since it is the default value)_:

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";

export default {
  output: "bun", // It is the default value
} satisfies Configuration;
```

After running `brisa build`, Brisa will generate a Bun server that serves your application on the port 3000 by default.

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
> If you want, you can use `NODE_ENV=production bun run build/server.js` to start your application with Bun.js without Brisa CLI.

## Custom server

If you want to use a custom server, you can follow this guide: [Custom Server](/building-your-application/configuring/custom-server#custom-server).
