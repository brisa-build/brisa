---
description: Use brisa.config.js file to configure Brisa.
---

# `brisa.config.js` options

The `brisa.config.(js|ts|jsx|tsx)` file is the main configuration file for an application using the Brisa framework. This file should export by default an object that satisfies the `Configuration` type structure. Below is a detailed explanation of how to define this configuration file and a unified example with comments on default values and how to configure them.

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";

const config: Configuration = {
  /**
   * `trailingSlash` configuration
   * Default: undefined (trailing slash is not modified)
   */
  trailingSlash: true, // Adds trailing slash to URLs

  /**
   * `assetPrefix` configuration
   * Default: undefined (no prefix added to assets)
   */
  assetPrefix: "https://cdn.example.com", // Prefix for assets

  /**
   * `extendPlugins` configuration
   * Default: undefined (no additional plugins added)
   */
  extendPlugins: (plugins, { dev, isServer }) => [
    ...plugins,
    {
      name: "my-plugin",
      setup(build) {
        build.onLoad({ filter: /\.txt$/ }, async (args) => {
          return {
            contents: "export default " + JSON.stringify(args.path) + ";",
            loader: "js",
          };
        });
      },
    },
  ],

  /**
   * `basePath` configuration
   * Default: undefined (no base path added)
   */
  basePath: "/my-app", // Base path for the application

  /**
   * `tls` configuration
   * Default: undefined (HTTPS is not enabled)
   */
  tls: {
    cert: Bun.file("cert.pem"),
    key: Bun.file("key.pem"),
  }, // Enable HTTPS

  /**
   * `output` configuration
   * Default: 'server'
   */
  output: "static", // Output type of the application
};

// Export the configuration as the default export
export default config satisfies Configuration;
```

## `trailingSlash`

The `trailingSlash` option allows you to add a trailing slash to all URLs. This is useful when you want to enforce a trailing slash on all URLs.

> [!NOTE]
>
> More information about the trailing slash can be found in the [Configuration](/building-your-application/configuring/trailing-slash) documentation.

## `assetPrefix`

The `assetPrefix` option allows you to add a prefix to all assets. This is useful when you want to serve assets from a CDN or a different domain.

> [!NOTE]
>
> More information about the asset prefix can be found in the [Configuration](/building-your-application/configuring/asset-prefix) documentation.

## `extendPlugins`

The `extendPlugins` option allows you to add additional plugins to the Brisa build pipeline. This is useful when you want to extend the default behavior of the build process.

> [!NOTE]
>
> More information about the asset prefix can be found in the [Configuration](/building-your-application/configuring/plugins) documentation.

## `basePath`

The `basePath` option allows you to set a base path for the application. This is useful when you want to deploy the application under a sub-path of a domain.

> [!NOTE]
>
> More information about the base path can be found in the [Configuration](/building-your-application/configuring/base-path) documentation.

## `tls`

The `tls` option allows you to enable HTTPS for the application. This is useful when you want to serve the application over a secure connection.

> [!NOTE]
>
> More information about the TLS configuration can be found in the [Configuration](/building-your-application/configuring/tls) documentation.

## `output`

The `output` option allows you to set the output type of the application. This is useful when you want to change the output directory of the application.

> [!NOTE]
>
> More information about the output configuration can be found in the [Configuration](/building-your-application/configuring/output) documentation.
