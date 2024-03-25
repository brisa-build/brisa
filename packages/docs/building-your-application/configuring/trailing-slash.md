---
description: Configure Brisa pages to resolve with or without a trailing slash.
---

# Trailing slash

By default Brisa will redirect urls with trailing slashes to their counterpart without a trailing slash. For example `/about/` will redirect to `/about`. You can configure this behavior to act the opposite way, where urls without trailing slashes are redirected to their counterparts with trailing slashes.

Open `brisa.config.ts` and add the `trailingSlash` config:

```ts filename="brisa.config.ts"
import type { Configuration } from "brisa";

export default {
  trailingSlash: true,
} satisfies Configuration;
```

With this option set, urls like `/about` will redirect to `/about/`.

When used with [`output: "static"`](/building-your-application/deploying/static-exports) configuration, the `/about` page will output `/about/index.html` (instead of the default `/about.html`).
