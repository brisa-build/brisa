---
title: Writing a custom adapter
---

# Writing a custom adapter

[Adapters](/building-your-application/configuring/output-adapter) are useful to don't write [IaC](https://en.wikipedia.org/wiki/Infrastructure_as_code) code, just plug and play. In Brisa, we offer adapters for some Cloud Providers, but you can write your own and share it with the community.

If an adapter for your preferred environment doesn't yet exist, you can build your own. We recommend [looking at the source for an adapter](https://github.com/brisa-build/brisa/tree/main/packages) to a platform similar to yours and copying it as a starting point.

> [!TIP]
>
> Feel free to contribute your adapter to the Brisa community by opening a pull request in the [Brisa repository](https://github.com/brisa-build/brisa).

Adapter packages implement the following API, which creates an `Adapter`:

```ts
import type { Adapter } from 'brisa';

export default function yourAdapter(options) {
	const adapter = {
		name: 'adapter-package-name',
		async adapt({ BUILD_DIR, ROOT_DIR, CONFIG }, prerenderedRoutes) {
			// adapter implementation
		},
	} satisfies Adapter;

	return adapter;
}
```

Both, `name` and `adapt` are required.

```ts
export type Adapter = {
  /**
   * The name of the adapter.
   */
  name: string;
  /**
   * This function is called after Brisa has built your app.
   */
  adapt(
    brisaConstants: BrisaConstants,
    prerenderedRoutes?: Map<string, string[]>,
  ): void | Promise<void>;
};
```

## `name`

The `name` field is a string that represents the name of the adapter.

## `adapt`

The `adapt` function is going to be called after Brisa has built your app in production mode.

`Adapter` type is:

### Parameters of `adapt`

The `adapt` receives the following parameters:

- The `brisaConstants` parameter is an object that contains all the constants used by Brisa and the output adapter. It contains information about the build, the environment, the configuration, and more.
- The `prerenderedRoutes` parameter is a map of routes to prerendered HTML files. In the case of a static export, this map will contain all the prerendered routes. In the case of a server output, this map will be filled with the prerendered routes, saved in the `BUILD_DIR` directory, under the `prerendered-pages` folder.


And `BrisaConstants` type is:
  
```ts
/**
 * Internal types used by Brisa and output adapters.
 */
export type BrisaConstants = {
  PAGE_404: string;
  PAGE_500: string;
  VERSION: string;
  VERSION_HASH: ReturnType<typeof Bun.hash>;
  WEB_CONTEXT_PLUGINS: string[];
  RESERVED_PAGES: string[];
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
  IS_SERVE_PROCESS: boolean;
  PORT: number;
  BUILD_DIR: string;
  ROOT_DIR: string;
  SRC_DIR: string;
  ASSETS_DIR: string;
  PAGES_DIR: string;
  I18N_CONFIG: I18nConfig;
  LOG_PREFIX: {
    WAIT: string;
    READY: string;
    INFO: string;
    ERROR: string;
    WARN: string;
    TICK: string;
  };
  LOCALES_SET: Set<string>;
  CONFIG: Configuration;
  IS_STATIC_EXPORT: boolean;
  REGEX: Record<string, RegExp>;
  BOOLEANS_IN_HTML: Set<string>;
  HEADERS: {
    CACHE_CONTROL: string;
  };
};
```

### Return value of `adapt`

The `adapt` function can return a `Promise<void>` or `void`. If the function returns a promise, Brisa will wait for the promise to resolve before continuing.
