---
description: createPortal lets you render some children into a different part of the DOM.
---

# createPortal

`createPortal` lets you render some children into a different part of the DOM.

## Reference

### `createPortal(children, domNode)`

To create a portal, call `createPortal`, passing some JSX, and the DOM node where it should be rendered:

```tsx
import { createPortal } from "brisa";

// ...

<div>
  <p>This child is placed in the parent div.</p>
  {createPortal(
    <p>This child is placed in the document body.</p>,
    document.body,
  )}
</div>;
```

A portal only changes the physical placement of the DOM node. In every other way, the JSX you render into a portal acts as a child node of the Brisa component that renders it.

> [!TIP]
>
> We recommend cleanup the portal when the component is unmounted. You can do this by using the [`cleanup`](/building-your-application/components-details/web-components#clean-effects-cleanup-method) function inside the Web Context API.

#### Parameters:

- `children`: Anything that can be rendered with Brisa, such as a piece of JSX (e.g. `<div />` or `<SomeComponent />`), a Fragment (`<>...</>`), a string or a number, or an array of these.
- `domNode`: Some DOM node, such as those returned by `document.querySelector()`. The node must already exist. Passing a different DOM node during an update will cause the portal content to be recreated.

#### Returns:

`createPortal` returns a node that can be included into JSX or returned from a component. If Brisa encounters it in the render output, it will place the provided `children` inside the provided `domNode`.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ❌      |
| Web Component     | ✅      |
| SSR Web Component | ❌      |
