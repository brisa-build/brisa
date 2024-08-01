---
description: Learn how build a Web Service App in Brisa
---

# Web Service App

Brisa by default is a web service application. This means that when you run `brisa build`, Brisa generates a Bun server that serves your application on the port 3000 by default, it can be changed with the flag `--port`.

This server is capable of serving your application with all the features that Brisa offers, such as i18n, routing, server actions and middleware.

## Configuration _(Optional)_

To enable a web service application, change the output mode inside [`brisa.config.ts`](/building-your-application/configuring/brisa-config-js) _(optional since it is the default value)_:

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";

export default {
  output: "server", // It is the default value
} satisfies Configuration;
```

After running `brisa build`, Brisa will generate a Bun server that serves your application on the port 3000 by default.

## Changing the port

To change the port, you can use the flag `--port`:

```sh
brisa build --port 8080
```

After running `brisa build`, Brisa will generate a Bun server that serves your application on the port 8080.

## Custom server

If you want to use a custom server, you can follow this guide: [Custom Server](/building-your-application/configuring/custom-server#custom-server).
