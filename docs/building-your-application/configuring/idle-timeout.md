---
description: Learn how to configure the idle timeout.
---

# Idle Timeout

The `idleTimeout` is the maximum amount of time a connection is allowed to be idle before the server closes it. A connection is idling if there is no data sent or received.

**Default**: `30` seconds.

## Example

In the next example, we are setting the `idleTimeout` to 10 seconds.

**brisa.config.ts**:

```ts 4
import type { Configuration } from "brisa";

export default {
  idleTimeout: 10,
} satisfies Configuration;
```

## Types

```ts
export type Configuration = {
  // ...
  idleTimeout?: number;
};
```

> [!NOTE]
>
> This `idleTimeout` is working in Bun and Node.js runtimes.
