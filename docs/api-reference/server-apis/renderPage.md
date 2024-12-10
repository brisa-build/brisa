---
description: rerender the page inside a server action
---

# renderPage

## Reference

### `renderPage(): Never`

The `renderPage` method is used to rerender the page inside a server action. Outside of an action, it throws an error.

`renderPage` needs to be called outside of the `try/catch` block:

```tsx
import { renderPage } from "brisa/server";

// Inside a server action
function handleEvent() {
  try {
    // ...
  } catch (error) {
    // ...
  }

  // Trigger a full-page rerender
  renderPage();
}
```

> [!NOTE]
>
> See the differences between "Action Signals" and `renderPage` in [this documentation](/building-your-application/data-management/server-actions#action-signals-vs-rerender).

### Parameters

- `withTransition` (optional): A boolean value that indicates whether the rerender should be done with [start view transition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition). Default is `false`.


#### Types:

```ts
function renderPage(): never;
```

#### Returns:

- `Never` does not require you to use `return rerenderInPage()` due to using the TypeScript [`never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) type.

> [!CAUTION]
>
> Avoid using the `renderPage` inside a `try/catch` block. The `navigate` is a throwable function and will break the execution of the current function.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ❌      |
| Web Component     | ❌      |
| SSR Web Component | ❌      |
| Actions           | ✅      |
| Middleware        | ❌      |
| Response headers  | ❌      |
