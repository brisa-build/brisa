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

The Provider does **not need any import**. You can use the custom element `context-provider` by passing the context and value. It is a web component because this way the value is going to be shared with the client components and also you can use the same provider in client components.

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

Parameters:

- `SomeContext`: The context that you’ve previously created with createContext. The context itself does not hold the information, it only represents the kind of information you can provide or read from components.

Returns:

- `useContext` returns the context value inside a signal for the calling component. It is determined as the value passed to the closest [`context-provider`](#provider) above the calling component in the tree. If there is no such provider, then the returned value will be the `defaultValue` you have passed to [`createContext`](#create-context-createcontext) for that context. The returned value is up-to-date, reactive under a signal.

#### `serverOnly` property

In many cases we want to share sensitive data on the server components-tree and that this data never reaches the client. To do this, the provider supports the `serverOnly` property and during SSR it is extripated so that it is never part of the final HTML.

```tsx
import { createContext } from "brisa";
import AnotherComponent from "@/components/another-component";

const ctx = createContext("foo");

export default function ServerComponent() {
  <context-provider serverOnly context={ctx} value="bar">
    <AnotherComponent />
  </context-provider>;
}
```

This means:

```tsx
<context-provider serverOnly context={ctx} value="bar">
  <div>Hello</div>
</context-provider>
```

Is going to be transformed to just this HTML: `<div>Hello</div>`. Without the `context-provider` on top.

> [!CAUTION]
>
> The `serverOnly` property in **runtime always works** and there is **no need to worry**. However, if you don't use any client context and you don't want to carry the `context-provider` code in the client we recommend that you use literal values, like `true|false` directly, since during the build we don't evaluate if there are dynamic values, then in this case the provider code will be carried in the client even if it is not used later and you will never see any sensitive data.

### Consume Context (`useContext`)

`useContext` is a Brisa Hook that lets you read and subscribe to context from your component.

```tsx
export default function MyComponent(props, { useContext }) {
  const theme = useContext(ThemeContext);
  return <div style={{ color: theme.value.color }}>Hello world</div>
```

> [!CAUTION]
>
> - `useContext()` call in a component is not affected by providers returned from the same component. The corresponding `<context-provider>` needs to be above the component doing the `useContext()` call.
> - Instead of an import it is inside the [`RequestContext`](/docs/building-your-application/data-fetching/request-context) or [`WebContext`](/docs/building-your-application/data-fetching/web-context). In the case of server the context is stored inside the request, since each request is different and it is better that it is not global to **avoid concurrency problems**. In the case of web is needed within the `WebContext` to generate a reactive signal that is cleared when the web component is disconnected.

### When to use context instead of [`store`](/docs/components-details/web-components#store-store-method)

Using Context instead of `store` comes at a price, since it generates a DOM element _(`context-provider` web component)_ unless you have set [`serverOnly`](#serveronly-property) attribute.

The difference is that `store` is a state shared with your entire app, while `context` is shared only between a tree of components. And the same context can have different values for different sub-trees.

We recommend that you use `store` whenever possible. For specific cases that for example you have a list of components and you want to avoid prop-drilling and pass to each item its values through a context, then feel free to use context because this is its purpose.

Example:

```tsx
import Ctx from "@/some-context";

export default function ItemListProvider({ items }) {
  return (
    <ul>
      {items.map((item, index) => (
        <context-provider context={Ctx} key={index} value={item}>
          {/* Avoid prop-drilling to the list-item component */}
          <list-item />
        </context-provider>
      ))}
    </ul>
  );
}
```
