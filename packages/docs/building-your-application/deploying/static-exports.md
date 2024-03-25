---
description: Learn how build a static site in Brisa
---

# Static exports

Brisa enables starting as a static site.

When running `brisa build`, Brisa generates an HTML file per route in SSG (Static Site Generation) mode. This approach helps in reducing the client-side JavaScript code, leading to smaller bundles and faster page loads.

Since Brisa supports this static export, it can be deployed and hosted on Content Delivery Networks ([CDNs](https://developer.mozilla.org/en-US/docs/Glossary/CDN)) on any web server that can serve HTML/CSS/JS static assets.

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

Redirects are no longer done through a server since there is no server once you make a static export. However, to support i18n and let the apps work when you want to put them in a desktop app, by default we do a [**soft redirect**](https://en.wikipedia.org/wiki/Wikipedia:Soft_redirect).

The soft redirect we apply does not have a 301/307 status. Instead, the `/index.html` page is loaded and when the browser opens it, the redirect is made to the user's browser language or to the `defaultLocale` through the client JavaScript.

To solve this, you must apply the redirects in the hosting where you host your web application.

Here are some links to documentation that may help you depending on the hosting you use:

- [Vercel](https://vercel.com/docs/projects/project-configuration#redirects) redirects.
- [AWS](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/example-function-redirect-url.html) redirects.
- [Netlify](https://docs.netlify.com/routing/redirects/) redirects
