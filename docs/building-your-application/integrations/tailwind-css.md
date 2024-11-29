---
description: Understand how to integrate Tailwind CSS v4 in your Brisa project
---

# Integrating Tailwind CSS v4

Brisa, offers versatile integration with third-party libraries like [TailwindCSS](https://tailwindcss.com/) to be automatically handled for the Brisa internals.

Tailwind lets you use utility classes instead of writing CSS. These utility classes are mostly one-to-one with a certain CSS property setting: for example, adding the `text-lg` to an element is equivalent to setting `font-size: 1.125rem` in CSS. You might find it easier to write and maintain your styles using these predefined utility classes!

## Installation

Run this command to integrate TailwindCSS in your Brisa project:

```sh
brisa add tailwindcss
```

And you are ready to use TailwindCSS in your Brisa project.

## Manual Installation

If you want to install TailwindCSS manually, you can do it by running:

```bash
bun install tailwindcss@next postcss brisa-tailwindcss
```

And then, you can add the integration in your `brisa.config.ts` file:

**brisa.config.ts**

```ts {4}
import brisaTailwindCSS from "brisa-tailwindcss";

export default {
  integrations: [brisaTailwindCSS()],
} satisfies Configuration;
```

And you are ready to use TailwindCSS in your Brisa project.

> [!NOTE]
>
> Installing the dependencies manually, take care to use a TailwindCSS version `v.4.x`.

## Configuration

You can configure TailwindCSS in your `brisa.config.ts` file:

```ts
import brisaTailwindCSS from "brisa-tailwindcss";

export default {
  integrations: [brisaTailwindCSS({ embedded: false })],
} satisfies Configuration;
```

The current configuration has only one option:

- `embedded` (optional): If you want to embed the TailwindCSS CSS in the build output. Default is `true`.

> [!NOTE]
>
> Tailwind needs a subdependency that cannot be compiled, which is [lightningcss](https://github.com/parcel-bundler/lightningcss), so the default is to treat it as external and then embed it inside build.

### Type

```ts
type Config = {
  embedded?: boolean;
};
```

## Defaults

If you don't have any `.css` file with `@tailwind` directive or `tailwindcss` import, Brisa will automatically generate in build-time a default CSS file with TailwindCSS directives to be similar than [TailwindCSS CDN](https://tailwindcss.com/docs/installation/play-cdn):

```css
@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/preflight" layer(base);
@import "tailwindcss/utilities" layer(utilities);
```

In the case you want to override the default CSS file, you can create a `.css` file in your `src` with `@tailwind` directives or `@import 'tailwindcss/...` and Brisa will use it instead of the default one. This `.css` file you need to import it in your `src/layout.ts` file.

## Usage

You can use TailwindCSS classes in your Brisa project as you would in a regular TSX file:

```tsx
export default function Home() {
  return (
    <div className="bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-800">Hello, world!</h1>
    </div>
  );
}
```
