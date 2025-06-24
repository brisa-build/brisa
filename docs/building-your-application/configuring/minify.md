---
description: Learn how to configure code minification
---

# Minify

Brisa automatically optimizes your production builds by minifying JavaScript and CSS bundles. This reduces file sizes by removing whitespace, shortening variable names, and applying other safe optimizations.


**brisa.config.ts**:

```ts {4}
import type { Configuration } from "brisa";

export default {
  minify: true // or false to disable
} satisfies Configuration;
```

## Default Behavior (`minify` config field not specified)

- **Development mode** (`brisa dev`): Minification is automatically disabled for better debugging
- **Production mode** (`brisa build`): Minification is automatically enabled
