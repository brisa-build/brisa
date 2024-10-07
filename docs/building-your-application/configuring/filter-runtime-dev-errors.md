---
description: Learn how to filter runtime development errors.
---

# Filter Runtime Development Errors

The `filterRuntimeDevErrors` configuration property in `brisa.config.ts` allows you to filter runtime development errors. This is useful for filtering out errors that are not relevant to your application.

## Example

In the next example, we are filtering out the `TypeError` error. This means that the error will not be logged to the console.

```ts 4
import type { Configuration } from "brisa";

export default {
  filterRuntimeDevErrors(error: ErrorEvent) {
    return !(error.error instanceof TypeError);
  },
} satisfies Configuration;
```

> [!IMPORTANT]
>
> This config property is stringified and passed to the client code only during development, so it should not have any side effects.

## Types

```ts
export type Configuration = {
  // ...
  filterRuntimeDevErrors?(error: ErrorEvent): boolean;
};
```
