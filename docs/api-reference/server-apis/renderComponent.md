---
description: rerender the component inside a server action
---

# renderComponent

## Reference

### `renderComponent({ element, target, mode, withTransition }: RenderComponentProps): Never`

The `renderComponent` method is used to rerender the component or render some component in an specific target location inside a server action. Outside of an action, it throws an error.

`renderComponent` needs to be called outside of the `try/catch` block:

```tsx
export default function MyComponent({ text = "foo" }: { text: string }) {
  function handleClick() {
    // Just a component rerender:
    renderComponent();

    // Trigger a component rerender with new props
    renderComponent({ element: <MyComponent text="bar" />});

    // Render a specific component on target location
    renderComponent({
      element: <Component {...props} />,
      target: "#target-id",
      mode: "replace",
      withTransition: true,
    });
  }

  return (
    <div>
      <button onClick={handleClick}>{text}</button>
    </div>
  );
}
```

> [!NOTE]
>
> See the differences between "Action Signals" and `renderComponent` in [this documentation](/building-your-application/data-management/server-actions#action-signals-vs-rerender).

#### Types:

```ts
function renderComponent<PropsType>(
  props: RenderComponentProps<PropsType> = {},
): never;

type RenderComponentProps = {
  element?: JSX.Element;
  target?: string;
  placement?: 'replace' | 'before' | 'after' | 'append' | 'prepend';
  withTransition?: boolean;
};
```

#### Parameters:

- `element` (optional): The component to render. By default, it will rerender the target component that triggered the action.
- `target` (optional): The target location to render the component. It can be a CSS selector.
- `placement` (optional): The placement to render the component. It can be `replace`, `before`, `after`, `append` or `prepend`. Default is `replace`.
- `withTransition` (optional): If `true`, it will render the component with [start view transition API](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition). Default is `false`.

#### Returns:

- `Never` does not require you to use `return renderComponent()` due to using the TypeScript [`never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) type.

> [!CAUTION]
>
> Avoid using the `renderComponent` inside a `try/catch` block. The `navigate` is a throwable function and will break the execution of the current function.

> [!TIP]
>
> Updating [`Action Signals`](/building-your-application/data-management/server-actions#action-signals) by default is going to use a `renderComponent`  without you having to specify it. If you specify it, it will fulfill only the `renderComponent` you specify.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ❌      |
| Web Component     | ❌      |
| SSR Web Component | ❌      |
| Actions           | ✅      |
| Middleware        | ❌      |
| Response headers  | ❌      |
