---
description: rerender the component or the page inside a server action
---

# rerenderInAction

## Reference

### `rerenderInPage({ type, renderMode, props }: RerenderInAction): Never`

The `rerenderInAction` method is used to rerender the component or the page
inside a server action. Outside of an action, it throws an error.

`rerenderInAction` needs to be called outside of the `try/catch` block:

```tsx
import { rerenderInAction } from "brisa/server";

// Inside a server action
function handleEvent() {
  try {
    // ...
  } catch (error) {
    // ...
  }

  // Trigger a full-page rerender
  rerenderInAction({ type: "page" });
}
```

Example of Component Rerender:

```tsx
export default function MyComponent({ text = "foo" }: { text: string }) {
  function handleClick() {
    // Trigger a component rerender with new props
    rerenderInAction({ type: "targetComponent", props: { text: "bar" } });
  }

  return (
    <div>
      <button onClick={handleClick}>{text}</button>
    </div>
  );
}
```

#### Types:

```ts
function rerenderInAction<PropsType>(
  props: RerenderInActionProps<PropsType> = {},
): never;

type RerenderInActionProps<T> =
  | {
      type?: "currentComponent" | "targetComponent";
      renderMode?: RenderMode;
      props?: T;
    }
  | {
      type?: "page";
      renderMode?: RenderMode;
    };
```

#### Parameters:

- `type`: The type of the rerender. It can be `currentComponent`, `targetComponent` or `page`. By default, it is `currentComponent`, this means that it is going to rerender the component that called the `rerenderInAction` method. When using `targetComponent` it is going to rerender the component that fired the original action. When using `page` it is going to rerender the whole page.
- `renderMode`: The type of the rerender. It can be `reactivity` or `transition`. By default, it is `reactivity`. When using `transition` it is done under [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API).
- `props`: The props to be passed to the component when rerendering.

#### Returns:

- `Never` does not require you to use `return rerenderInPage()` due to using the TypeScript [`never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) type.

> [!CAUTION]
>
> Avoid using the `rerenderInPage` inside a `try/catch` block. The `navigate` is a throwable function and will break the execution of the current function.

> [!TIP]
>
> Updating [`Action Signals`](/building-your-application/data-management/server-actions#action-signals) by default is going to use a `rerenderInAction` with `component` type and `reactivity` mode without you having to specify it. If you specify it, it will fulfill only the `rerenderInAction` you specify.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ❌      |
| Web Component     | ❌      |
| SSR Web Component | ❌      |
| Actions           | ✅      |
| Middleware        | ❌      |
| Response headers  | ❌      |
