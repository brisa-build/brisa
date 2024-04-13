---
description: Configure Brisa to deploy under a sub-path of a domain.
---

# `basePath`

To deploy a Brisa application under a sub-path of a domain you can use the `basePath` config option.

`basePath` allows you to set a path prefix for the application. For example, to use `/docs` instead of `''` (an empty string, the default), open `brisa.config.ts` and add the `basePath` config:

:::tabs key:language
==brisa.config.ts

```ts
import type { Configuration } from "brisa";

export default {
  basePath: "/docs",
} satisfies Configuration;
```

:::

> [!TIP]
>
> This value must be set at build time and cannot be changed without re-building as the value is inlined in the client-side bundles.

## Anchor HTML element (`a`)

When linking to other pages using the anchor HTML element (`a`) the `basePath` will be automatically applied.

For example, using `/about` will automatically become `/docs/about` when `basePath` is set to `/docs`.

This makes sure that you don't have to change all links in your application when changing the `basePath` value.

## Media via `src` attribute

Consuming media with the `src` field (`video`, `img`...), if the path is relative the `basePath` is also added by default.
