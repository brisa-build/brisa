---
description: Learn how to compress assets to GZIP/Brotli and use these compressed files in your Brisa application.
---

# assetCompression

By default, Brisa serves assets in their original form. However, you can configure Brisa to compress assets using GZIP or Brotli (depending on the browser). This can significantly reduce the size of assets, leading to faster load times and reduced bandwidth usage.

Open the `brisa.config.ts` file and add the `assetCompression` configuration:

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";

export default {
  assetCompression: true,
} satisfies Configuration;
```

With this configuration, Brisa will compress all assets using GZIP and Brotli **once in build time**. When a browser requests an asset, Brisa will check if the browser supports Brotli compression. If the browser supports Brotli, Brisa will serve the Brotli-compressed asset. Otherwise, it will serve the GZIP-compressed asset.

If you want to disable asset compression, set the `assetCompression` configuration to `false` or just remove it from the configuration.

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";

export default {
  assetCompression: false,
} satisfies Configuration;
```

When asset compression is disabled, Brisa will serve assets in their original form without any compression. _(This is the default behavior.)_

> [!CAUTION]
>
> Asset compression is a build-time operation. When you enable asset compression, Brisa will compress all assets during the build process. This can increase the build time, especially for large applications with many assets. However, the performance benefits of compressed assets usually outweigh the increased build time.

> [!TIP]
>
> If you want to serve assets from a CDN, you can use the `assetPrefix` configuration. For more information, see the [assetPrefix](/building-your-application/configuring/asset-prefix) documentation.
