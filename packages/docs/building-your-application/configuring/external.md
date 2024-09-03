---
description: Learn how to configure external dependencies.
---

# External Dependencies

The `external` configuration property in `brisa.config.ts` allows you to define external dependencies that should not be included in the final bundle. This is useful for libraries that are already included in the runtime environment, or for libraries that should be resolved at runtime.

## Example

In the next example, we are importing the `lightningcss` library as an external dependency. This means that the library will not be included in the final bundle, but will be resolved at runtime.


```ts
import type { Configuration } from "brisa";

export default {
  external: ["lightningcss"],
} satisfies Configuration;

## Types

```ts
export type Configuration = {
  // ...
  external?: string[];
};
```