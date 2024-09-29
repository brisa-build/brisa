---
description: Learn how to integrate some libraries in your Brisa project.
---

# Integrations

Brisa, offers versatile integration with third-party libraries like [TailwindCSS](https://tailwindcss.com/) to be automatically handled for the Brisa internals.

If you use `brisa add tailwindcss` and you do not have `brisa.config.ts` yet, this will be automatically generated:

**brisa.config.ts**

```ts {5}
import brisaTailwindCSS from "brisa-tailwindcss";
import type { Configuration } from "brisa";

export default {
  integrations: [brisaTailwindCSS()],
} satisfies Configuration;
```

In this example, this piece of code help to integrate TailwindCSS inside the Brisa internals.

## Types

```ts
export type Configuration = {
  // ...
  integrations?: Integration[];
};

export type Integration = {
  name: string;
  transpileCSS?(pathname: string, content: string): Promise<string>;
  defaultCSS?: {
    content: string;
    applyDefaultWhenEvery: (content: string) => boolean;
  }}
```