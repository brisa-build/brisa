---
description: Render a JSX element to a string on the server side.
---

# renderToString

## Reference

### `renderToString(element: JSX.Element, request?: Request): Promise<string>`

The `renderToString` function is used to render a JSX element to a string on the server side.

#### Parameters:

- `element`: The JSX element to render.
- `options` (optional): An optional object with `request` and `applySuspense`.

Types:

```ts
export async function renderToString(
  element: JSX.Element,
  options: { request?: Request; applySuspense?: boolean } = {},
): Promise<string>;
```

> [!NOTE]
>
> The `request` parameter by default is `new Request('http://localhost')`. The request object can be used inside the JSX Server Components, for this, you can change the default value to the request object that you want to use.

> [!NOTE]
>
> The default value for `applySuspense` is `false`. Normally, we only need suspense during HTML streaming, so we don't need to apply it when rendering to a string. However, if you want to apply suspense, you can set `applySuspense` to `true`.

#### Returns:

- A `Promise` that resolves to a string representing the rendered JSX element.

Example usage:

```tsx
import { renderToString } from "brisa";

const htmlString = await renderToString(<div>Hello, world!</div>);
console.log(htmlString); // Output: '<div>Hello, world!</div>'
```

> [!CAUTION]
>
> In principle you should never use it. We expose it so that our prerender macro can use it. Preferably if you need to use it use the [prerender-macro](/api-reference/macros/prerender) so that it is done in buildtime instead of runtime.
