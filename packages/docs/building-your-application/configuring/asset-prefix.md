---
description: Learn how to use the assetPrefix config option to configure your CDN.
---

# assetPrefix

By default, Brisa serves assets from the same domain as the application. However, you can configure Brisa to use a Content Delivery Network (CDN) for serving assets. This is useful for improving the performance of your application by offloading static assets to a separate, geographically distributed server.

Open the `brisa.config.ts` file and add the `assetPrefix` configuration:

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";

export default {
  assetPrefix: "https://your-cdn-url.com",
} satisfies Configuration;
```

Replace `"https://your-cdn-url.com"` with the base URL of your CDN. With this configuration, Brisa will prepend the assetPrefix to the URLs of all assets, such as images, stylesheets, and scripts.

For example, if you have an image with the path `/images/logo.png`, Brisa will generate the URL as `https://your-cdn-url.com/images/logo.png`.

When used with the `output: "static"` configuration, static assets will also be linked with the specified `assetPrefix`. For instance, if your static asset is /images/header.jpg, the generated file will be located at `https://your-cdn-url.com/images/header.jpg` instead of the default `/images/header.jpg`.

Using a CDN for assets can significantly enhance the loading speed of your application by leveraging the CDN's global network infrastructure.
