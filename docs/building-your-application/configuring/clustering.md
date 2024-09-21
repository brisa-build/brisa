---
description: Learn how to cluster your Brisa application to improve performance and reliability.
---

# `clustering`

To improve the performance and reliability of your Brisa application, you can enable clustering through the `clustering` configuration property. When `clustering` is `true`, Brisa will fork the process for each CPU core and will load balance the requests.

The default value is `true` in production and when the operating system will load balance the requests correctly. Otherwise, the default value is `false`.

> [!WARNING]
>
> The load balancing is working fine only in Linux. On Windows and macOS, the operating system does not load balance HTTP connections as one would expect.

## Example

:::tabs key:language
==TypeScript

```ts
//brisa.config.ts
import type { Configuration } from "brisa";

export default {
  clustering: true, // This enable clustering in prod and dev.
} satisfies Configuration;
```

:::

To make it possible, Brisa uses [`node:cluster`](https://nodejs.org/api/cluster.html) to handle the clustering. This Node API also works in Bun.

> [!CAUTION]
>
> If you need to use a [Custom Server](/building-your-application/configuring/custom-server), this configuration does not apply, and you need to handle the clustering yourself.
