---
description: SSRWebComponent is a compoment wrapper that allows you to render a web component on the server side.
---

# `SSRWebComponent`

## Reference

### `SSRWebComponent`

The `SSRWebComponent` is a component wrapper that allows you to render a web component on the server side taking care of [Declarative Shadow DOM](https://web.dev/articles/declarative-shadow-dom) and Custom Elements.

## Example usage:

In the next example, we use the `SSRWebComponent` to render a web component on the server side.

```tsx
import { SSRWebComponent } from "brisa/server";
import MyComponent from "@/web-components/my-component";

export function MyComponent() {
  // It's the same than: <my-component someProp="foo" /> 
  // but without compilation process:
  return (
    <SSRWebComponent
      selector="my-component"
      Component={MyComponent}
      someProp="value"
    />
  );
}
```

> [!IMPORTANT]
>
> This work is usually **done by Brisa for you during compilation**, so you can use `<web-component />` directly in your code without having to do 2 imports and use this wrapper. However, it is exposed in case someone needs to do it manually for some reason.

> [!CAUTION]
>
> The `selector` prop is required and must match the web component's tag name, also the `Component` prop is required and must be the web component itself.

## Types

```tsx
export function SSRWebComponent<T>(
  props: T & { selector: string, Component: ComponentType<T>, children?: JSX.Element },
): JSX.Element;
```

