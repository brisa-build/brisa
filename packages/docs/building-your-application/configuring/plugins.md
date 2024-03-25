---
description: Learn how to use Bun/esbuild plugins
---

# Plugins

Brisa uses Bun, and Bun provides a [universal plugin API](https://bun.sh/docs/runtime/plugins) that can be used to extend both the _runtime_ and _bundler_.

As Brisa requires bundler, we recommend you to use the **bundler approach**.

Plugins intercept imports and perform custom loading logic: reading files, transpiling code, etc. They can be used to add support for additional file types, like `.scss` or `.yaml`. In the context of Bun's bundler, plugins can be used to implement framework-level features like CSS extraction, macros, and client-server code co-location.

## Usage in bundler

To use a plugin during the build, you must add it to the `extendPlugins` config in the `brisa.config.ts` file. Brisa will take care of running it for both the build of server files and the build of client files (web-components).

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";
import { MyPlugin } from "my-plugin";

export default {
  extendPlugins(plugins, { dev, isServer }) {
    return [...plugins, MyPlugin];
  },
} satisfies Configuration;
```

A plugin is defined as simple JavaScript object containing a name property and a setup function. Example of one:

```ts filename="my-plugin.ts"
import type { BunPlugin } from "bun";

export const myPlugin: BunPlugin = {
  name: "Custom loader",
  setup(build) {
    // implementation
  },
};
```

> [!NOTE]
>
> To know more about bundler Bun plugins take a look at the [Bun documentation](https://bun.sh/docs/bundler/plugins).

> [!NOTE]
>
> In the case you want to know how to load plugins in _runtime_ (not recommended in Brisa), take a look at this [Bun documentation](https://bun.sh/docs/runtime/plugins).
