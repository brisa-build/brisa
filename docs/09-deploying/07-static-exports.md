---
title: Static exports
description: Learn how build a static site in Brisa
---

Brisa enables starting as a static site.

When running `brisa build`, Brisa generates an HTML file per route. Brisa can avoid loading unnecessary JavaScript code on the client-side, reducing the bundle size and enabling faster page loads.

Since Brisa supports this static export, it can be deployed and hosted on any web server that can serve HTML/CSS/JS static assets.

## Configuration

To enable a static export, change the output mode inside `brisa.config.ts`:

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";

export default {
  output: "static",
} satisfies Configuration;
```

After running `brisa build`, Brisa will produce an `out` folder which contains the HTML/CSS/JS assets for your application.

> [!CAUTION]
>
> Note that without a server, redirects such as `trailingSlash` will not work. You will have to manage this type of redirects on the host where you upload your static files.

> [!CAUTION]
>
> When generating the static files, all pages are called with the request `new Request('localhost:3000')`, without any configuration option. The middleware (if you have it) will only act during the build and never in runtime.

> [!CAUTION]
>
> Pure server stuff like api endpoints and server interactions will not work in runtime. All the interaction part should be in web-components only.

## Hard redirects

TODO
