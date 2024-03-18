---
description: Render a JSX element to a string on the server side.
---

# renderToString

## Reference

### `renderToString(element: JSX.Element, request?: Request): Promise<string>`

The `renderToString` function is used to render a JSX element to a string on the server side.

#### Parameters:

- `element`: The JSX element to render.
- `request` (optional): An optional parameter of type `Request`.

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
