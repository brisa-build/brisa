---
title: TypeScript
description: Brisa provides a TypeScript-first development experience for building your application.
---

# TypeScript

Brisa provides a TypeScript-first development experience for building your application.

It comes with built-in TypeScript support for automatically installing the necessary packages and configuring the proper settings thanks to [Bun](https://bun.sh/docs/runtime/typescript).

`bun create brisa` ships with TypeScript by default.

```bash filename="Terminal"
bun create brisa
```

By default `tsconfig.json` file is created, with the `@` path.

> [!CAUTION]
>
> Please, do not modify this path alias configuration. It's internally used in Brisa "`types.ts`" file to enable type-safe. If you need a different one, add it.

## Documentation on types

One of the things we have focused a lot on is that developers can learn and consult documentation in the code itself without having to go to the browser. You can hover over each `WebContext`/`RequestContext` property/method to get information and access the documentation link for more info. Also while typing JSX you can consult documentation for each HTML element and each attribute.

## Type-safe for web components

Web components are like other HTML elements, that is, you don't need to import them to use them. However, to improve the DX we offer type-safe to show you all the web components you have inside the `web-components` folder.

> [!TIP]
>
> Thanks to this: you can read your JSX to know which components are clients and which are servers, and you don't mix client code in the server components.

> [!IMPORTANT]
>
> The type-safe for web components are created inside the development CLI. If they do not appear, you must have "`brisa dev`" open.

## Safe return on components

Using `eslint` (optional) with `@typescript-eslint/no-unsafe-return`, you can use `JSXNode` from `brisa`.

```tsx
import { JSXNode } from "brisa";

export default function MyComponent(): JSXNode {
  return <div>Hello World</div>;
}
```

## Type-safe for i18n

There is type-safe enabled for all i18n keys that you can consume on the pages.
