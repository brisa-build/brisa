---
title: Context
description: Understand what context is and how to use it
---

Context provides a way to pass data through the component tree without having to pass props down manually at every level. It works for both server and web components.

In a typical Brisa application, data is passed top-down (parent to child) via props, but such usage can be cumbersome for certain types of props (e.g. locale preference, UI theme) that are required by many components within an application. Context provides a way to share values like these between components without having to explicitly pass a prop through every level of the tree.

### Create Context (`createContext`)

`createContext` lets you create a context that components can provide or read.

```ts
import { createContext } from "brisa";

const defaultValue = "foo";
const SomeContext = createContext(defaultValue);
```

Parameters:

- `defaultValue`: The value that you want the context to have when there is no matching context provider in the tree above the component that reads context. If you don’t have any meaningful default value, specify null. The default value is meant as a “last resort” fallback. It is static and never changes over time.

### Provider

The Provider is required to propagate a value from this context to a sub-tree of components.

The Provider does **not need any import**. You can use the custom element `context-provider` by passing the context and value.

Although in both server and client the context is used exactly the same, the main difference between them is the following:

In the server-components the `context-provider` is a tag that does not end in the HTML, it is only used so that the rendering from the server knows how to manage the context. That is to say, the final HTML would be only the HTML inside AnotherComponent.

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

In web-components if there is the actual `context-provider` web-component to be able to manage the context on the client. That is to say, the final HTML would be the tag of the `context-provider` + the HTML of the another-component.

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

### Consume Context (`useContext`)

`useContext` is a Brisa Hook that lets you read and subscribe to context from your component.

```tsx
export default function MyComponent(props, { useContext }) {
  const theme = useContext(ThemeContext);
  return <div style={{ color: theme.value.color }}>Hello world</div>
```

Parameters:

- `SomeContext`: The context that you’ve previously created with createContext. The context itself does not hold the information, it only represents the kind of information you can provide or read from components.

Returns:

- `useContext` returns the context value inside a signal for the calling component. It is determined as the value passed to the closest [`context-provider`](#provider) above the calling component in the tree. If there is no such provider, then the returned value will be the `defaultValue` you have passed to [`createContext`](#create-context-createcontext) for that context. The returned value is up-to-date, reactive under a signal.

Caveats:

- `useContext()` call in a component is not affected by providers returned from the same component. The corresponding `<context-provider>` needs to be above the component doing the `useContext()` call.
- Instead of an import it is inside the [`RequestContext`](/docs/building-your-application/data-fetching/request-context) or [`WebContext`](/docs/building-your-application/data-fetching/web-context). In the case of server the context is stored inside the request, since each request is different and it is better that it is not global to **avoid concurrency problems**. In the case of web is needed within the `WebContext` to generate a reactive signal that is cleared when the web component is disconnected.
