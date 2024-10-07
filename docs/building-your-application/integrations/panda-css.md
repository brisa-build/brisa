---
description: Understand how to integrate Panda CSS in your Brisa project
---

# Integrating Panda CSS

Brisa, offers versatile integration with third-party libraries like [PandaCSS](https://panda-css.com/) to be automatically handled for the Brisa internals.

PandaCSS lets you create atomic compiled styles like tailwind. You might find it easier to write and maintain your styles using this.

## Installation

Run this command to integrate PandaCSS in your Brisa project:

```sh
brisa add pandacss
```

And you are ready to use PandaCSS in your Brisa project.

## Manual Installation

If you want to install PandaCSS manually, you can do it by running:

```bash
bun add -D @pandacss/dev postcss
bun panda init -p
```

And then, you can add the integration in your `brisa.config.ts` file:

**brisa.config.ts**

```ts {4}
import brisaPandaCSS from "brisa-pandacss";

export default {
  integrations: [brisaPandaCSS()],
} satisfies Configuration;
```

And then, in your package.json add the following to the `scripts` section:

```json
{
  "scripts": {
    "prepare": "panda codegen",
  }
}
```

And then, create a `.css` file and add the following code:

```css
@layer reset, base, tokens, recipes, utilities; 
```

Then import the file in `layout.tsx` file
And you are ready to use PandaCSS in your Brisa project.

> [!NOTE]
>
> Installing the dependencies manually, take care to use a PandaCSS version `v0.46.x`.

## Usage

You can use PandaCSS classes in your Brisa project as you would in a regular TSX file:

```tsx
import { css } from './styled-system/css'
 
export function App() {
  return <div className={css({ bg: 'red.400' })} />
}
```
