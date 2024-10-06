---
description: Use brisa.config.ts file to configure Brisa.
---

# `brisa.config.ts` options

The `brisa.config.(js|ts|jsx|tsx)` file is the main configuration file for an application using the Brisa framework. This file should export by default an object that satisfies the `Configuration` type structure. Below is a detailed explanation of how to define this configuration file and a unified example with comments on default values and how to configure them.

```ts filename="brisa.config.ts"
import brisaTailwindCSS from "brisa-tailwindcss";
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
   * Default: 'bun'
   */
  output: "static", // Output type of the application

  /**
   * `external` configuration
   * Default: undefined (no external dependencies)
   */
  external: ["lightningcss"],

  /**
   * `integrations` configuration
   * Default: undefined (no integrations added)
   */
  integrations: [brisaTailwindCSS()],
};

// Export the configuration as the default export
export default config satisfies Configuration;
```

## [`trailingSlash`](/building-your-application/configuring/trailing-slash)

The `trailingSlash` option allows you to add a trailing slash to all URLs. This is useful when you want to enforce a trailing slash on all URLs.

> [!NOTE]
>
> More information about the trailing slash can be found in the [Configuration](/building-your-application/configuring/trailing-slash) documentation.

## [`assetPrefix`](/building-your-application/configuring/asset-prefix)

The `assetPrefix` option allows you to add a prefix to all assets. This is useful when you want to serve assets from a CDN or a different domain.

> [!NOTE]
>
> More information about the asset prefix can be found in the [Configuration](/building-your-application/configuring/asset-prefix) documentation.

## [`extendPlugins`](/building-your-application/configuring/plugins)

The `extendPlugins` option allows you to add additional plugins to the Brisa build pipeline. This is useful when you want to extend the default behavior of the build process.

> [!NOTE]
>
> More information about the asset prefix can be found in the [Configuration](/building-your-application/configuring/plugins) documentation.

## [`basePath`](/building-your-application/configuring/base-path)

The `basePath` option allows you to set a base path for the application. This is useful when you want to deploy the application under a sub-path of a domain.

> [!NOTE]
>
> More information about the base path can be found in the [Configuration](/building-your-application/configuring/base-path) documentation.

## [`tls`](/building-your-application/configuring/tls)

The `tls` option allows you to enable HTTPS for the application. This is useful when you want to serve the application over a secure connection.

> [!NOTE]
>
> More information about the TLS configuration can be found in the [Configuration](/building-your-application/configuring/tls) documentation.

## [`output`](/building-your-application/configuring/output)

The `output` option allows you to set the output type of the application. This is useful when you want to change the output directory of the application.

## [`external`](/building-your-application/configuring/external)

The `external` option allows you to define external dependencies that should not be included in the final bundle. This is useful for libraries that are already included in the runtime environment, or for libraries that should be resolved at runtime.

> [!NOTE]
>
> More information about the output configuration can be found in the [Configuration](/building-your-application/configuring/output) documentation.

## [`integrations`](/building-your-application/configuring/integrations)

The `integrations` option allows you to integrate third-party libraries with the Brisa internals. This is useful when you want to automatically handle the integration of libraries like TailwindCSS.

