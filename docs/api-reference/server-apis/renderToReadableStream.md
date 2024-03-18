---
description: Render a JSX element to a readable stream on the server side.
---

# renderToReadableSteam

## Reference

### `renderToReadableStream(element: JSX.Element, options: Options): ReadableStream<any>`

The `renderToReadableStream` function is used to render a JSX element to a stream on the server side.

#### Parameters:

- `element`: The JSX element to render.
- `options`: Options is an object with `request`, `head`, `log`, these is `Options` the type:
  ```tsx
  type Options = {
    request: RequestContext;
    head?: ComponentType;
    log?: boolean;
  };
  ```

#### Returns:

- A `Promise` that resolves to a string representing the rendered JSX element.

Example usage:

```tsx
import { renderToReadableStream } from "brisa";

const stream = renderToReadableStream(<div>Hello, world!</div>, {
  request: new Request("http://localhost"),
});

console.log(await Bun.readableStreamToText(stream)); // Output: '<div>Hello, world!</div>'
```

> [!CAUTION]
>
> In principle you should never use it. We expose it so that our prerender macro can use it. Preferably if you need to use it use the [prerender-macro](/api-reference/macros/prerender) so that it is done in buildtime instead of runtime.
