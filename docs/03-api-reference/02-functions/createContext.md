---
title: createContext
description: Use `createContext` to create a context to share in your components
---

`createContext` lets you create a context that components can provide or read. It is used to create a context with a default value.

## Reference

### `createContext(defaultValue)`

Call `createContext` outside of any components to create a context.

```ts
import { createContext } from "brisa";

const defaultValue = "foo";
const SomeContext = createContext(defaultValue);
```

#### Parameters:

- `defaultValue`: The value that you want the context to have when there is no matching context provider in the tree above the component that reads context. If you don’t have any meaningful default value, specify null. The default value is meant as a “last resort” fallback. It is static and never changes over time.

#### Returns:

`createContext` returns a context object.

Typically, you will use this context in a [`context-provider`](/docs/api-reference/components/context-provider) component, or the [`useContext`](/docs/building-your-application/components-details/context#consume-context-usecontext) hook.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ✅      |
| Web Component     | ✅      |
| SSR Web Component | ✅      |
