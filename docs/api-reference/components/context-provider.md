---
description: Use `context-provider` component to share data with the tree of child components.
---

# context-provider

## Reference

### `<context-provider context={Context} value="foo">...</context-provider>`

The `context-provider` component is required to propagate a value from some [context](/building-your-application/components-details/context) to a sub-tree of components.

The `context-provider` does **not need any import**. You can use the custom element `context-provider` by passing the `context` and `value`. It is a web component because this way the value is going to be shared with the web components and also you can use the same provider in web components.

**Server component:**

```tsx
import { createContext } from "brisa";
import AnotherComponent from "@/components/another-component";

const ctx = createContext("foo");

export default function ServerComponent() {
  <context-provider context={ctx} value="bar">
    <AnotherComponent />
  </context-provider>;
}
```

**Web component:**

```tsx
import { createContext } from "brisa";

const ctx = createContext("foo");

export default function WebComponent() {
  <context-provider context={ctx} value="bar">
    <another-component />
  </context-provider>;
}
```

#### Parameters:

- `SomeContext`: The context that you’ve previously created with createContext. The context itself does not hold the information, it only represents the kind of information you can provide or read from components.

##### Returns:

- `useContext` returns the context value inside a signal for the calling component. It is determined as the value passed to the closest [`context-provider`](/building-your-application/components-details/context#provider) above the calling component in the tree. If there is no such provider, then the returned value will be the `defaultValue` you have passed to [`createContext`](/building-your-application/components-details/context#create-context-createcontext) for that context. The returned value is up-to-date, reactive under a signal.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ✅      |
| Web Component     | ✅      |
| SSR Web Component | ✅      |
