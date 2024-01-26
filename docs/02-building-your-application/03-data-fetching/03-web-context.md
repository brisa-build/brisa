---
title: Web Context
description: Understand WebContext to create reactive web components in Brisa applications.
---

The `WebContext` is a set of utilities provided by Brisa to facilitate the development of web components. It encompasses various functionalities such as managing state, handling context, performing effects, and more. This context allows developers to create reactive web components in Brisa applications.

```tsx
import type { WebContext } from "brisa";

export default function WebComponent(props, webContext: WebContext) {
  const {
    // Shared data across web components
    store,
    useContext,

    // Internal state of this web component
    state,
    derived,

    // Manage web component effects
    effect,
    cleanup,
    onMount,

    // Add reactive styles
    css,

    // Consume translations and control internationalization
    i18n,

    // Access to the web component DOM element
    self,
  } = webContext;
  // ... Web component implementation ...
}
```

In contrast to other frameworks that necessitate state imports, our methodology incorporates all state properties directly within each web component. This distinctive design empowers enhanced control over the web component's lifecycle, facilitating the [expansion of the web context](#expanding-the-webcontext) through precise core management using plugins.

## `store`

`store: ReactiveMap`

The `store` property is a reactive map where values can be stored and shared among all web components. It serves as a global state accessible by all components. Values can be set and retrieved using the `store.set` and `store.get` methods.

Example setting a value:

```ts
store.set("count", 0);
```

Example getting a value:

```tsx
<div>{store.get("count")}</div>
```

For more details, refer to the [store](/docs/components-details/web-components#store-store-method) documentation.

## `useContext`

`useContext: <T>(context: BrisaContext<T>) => { value: T }`

The `useContext` method is used to consume a context value. It takes a `BrisaContext` as a parameter and returns a signal containing the context value. The context value is often used for passing data between a provider and multiple consumers within a component tree.

Example:

```tsx
const foo = useContext(context);
return <div>{foo.value}</div>;
```

For more details, refer to the [context](/docs/components-details/context) documentation.

> [!IMPORTANT]
>
> When referring to `useContext`, it is essential to note that this term should not be confused with the broader concept of `WebContext` mentioned earlier. The `useContext` is a Brisa Hook for consuming context value, that is piece of data that can be shared across multiple Brisa components. The `WebContext` denotes the overall environment and configuration specific to each web component, offering a unique and more comprehensive control mechanism. Understanding this distinction is crucial for a clear comprehension of our framework's architecture.

## `state`

`state<T>(initialValue?: T): Signal<T>`

The `state` method is used to declare reactive state variables. It returns a `Signal` that represents the state, and any changes to the state trigger reactivity updates in the associated components.

Example declaration:

```ts
const count = state<number>(0);
```

Example usage:

```tsx
<div>{count.value}</div>
```

Example mutation:

```ts
count.value += 1;
```

For more details, refer to the [state](/docs/components-details/web-components#state-state-method) documentation.

## `derived`

`derived<T>(fn: () => T): Signal<T>`

The `derived` method is useful for creating signals derived from other signals, such as state or props. It allows developers to compute values based on existing signals.

Example of declaration:

```ts
const doubleCount = derived(() => count.value * 2);
```

Example of usage:

```tsx
<div>{doubleCount.value}</div>
```

For more details, refer to the [derived](/docs/components-details/web-components#derived-state-and-props-derived-method) documentation.

## `effect`

`effect(fn: Effect): void`

The `effect` method is used to define functions that will be executed when the component is mounted and every time a registered signal within the effect changes. It helps manage side effects such as data fetching or DOM manipulation.

Example:

```ts
effect(() => {
  // This log is executed every time someSignal.value changes
  console.log(`Hello ${someSignal.value}`);
});
```

For more details, refer to the [effect](/docs/components-details/web-components#effects-effect-method) documentation.

## `cleanup`

`cleanup(fn: Cleanup): void`

The `cleanup` method defines functions that will be executed when the component is unmounted or to clean up an effect. It helps prevent memory leaks and ensures proper cleanup.

Example:

```ts
effect(() => {
  window.addEventListener("storage", handleOnStorage);
  cleanup(() => window.removeEventListener("storage", handleOnStorage));
});

cleanup(() => console.log("Web Component unmounted!"));
```

For more details, refer to the [cleanup](/docs/components-details/web-components#clean-effects-cleanup-method) documentation.

## `onMount`

`onMount(fn: Effect): void`

The `onMount` method is triggered only once when the component is mounted. It is useful for handling actions that should occur during the initial mount, such as setting up document events or accessing rendered DOM elements.

While the `effect` are executed on the fly, the `onMount` waits until the entire web component has been rendered.

Example:

```ts
onMount(() => {
  console.log("Yeah! Component has been mounted");
});
```

For more details, refer to the [onMount](/docs/components-details/web-components#effect-on-mount-onmount-method) documentation.

## `css`

`css(strings: TemplateStringsArray, ...values: string[]): void`

The `css` template literal is used to inject reactive CSS into the DOM. It allows developers to define styles directly within web components using a template literal.

The styles are encapsulated within the [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM), ensuring that they do not interfere with each other across web components.

Example:

```ts
css`
  div {
    background-color: ${color.value};
  }
`;
```

For more details, refer to the [Template literal `css`](/docs/components-details/web-components#template-literal-css) documentation.

## `i18n`

`i18n: I18n`

The `i18n` object provides utilities for accessing the locale and consuming translations within components.

Example:

```tsx
const { t, locale } = i18n;
return <div>{t("hello-world")}</div>;
```

For more details, refer to the [i18n](/docs/building-your-application/routing/internationalization) documentation.

## `self`

`self: HTMLElement`

The `self` property in the `WebContext` provides access to the DOM element of the web component. It allows developers to interact directly with the component's rendered output, enabling manipulation and customization.

Example:

```tsx
self.addEventListener("click", () => {
  console.log("Web component clicked!");
});
```

## Expanding the WebContext

TODO
