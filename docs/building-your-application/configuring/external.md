---
description: Learn how to configure external dependencies.
---

# External Dependencies

The `external` configuration property in `brisa.config.ts` allows you to define external dependencies that should not be included in the final bundle. This is useful for libraries that are already included in the runtime environment, or for libraries that should be resolved at runtime.

> [!NOTE]
>
> Brisa is including your `devDependencies` as external dependencies by default. This means that you don't need to include them in the `external` configuration property.

## Example

In the next example, we are importing the `lightningcss` library as an external dependency. This means that the library will not be included in the final bundle, but will be resolved at runtime.


```ts 4
import type { Configuration } from "brisa";

export default {
  external: ["lightningcss"],
} satisfies Configuration;
```

> [!NOTE]
>
> This config property is used in the build processes we use with Bun bundler. For more information on this field, take a look at the [Bun bundler documentation](https://bun.sh/docs/bundler#external).

## Types

```ts
export type Configuration = {
  // ...
  external?: string[];
};
```
