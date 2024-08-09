---
description: Understand WebContext to create reactive web components in Brisa applications.
---

# Web Context

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
    reset,

    // Add reactive styles
    css,

    // Consume translations and control internationalization
    i18n,

    // Access to the name, pathname, params, and query of the current
    // page route (also available in SSR)
    route,

    // Access to the web component DOM element
    self,
  } = webContext;
  // ... Web component implementation ...
}
```

In contrast to other frameworks that necessitate state imports, our methodology incorporates all state properties directly within each web component. This distinctive design empowers enhanced control over the web component's lifecycle, facilitating the [expansion of the web context](#expanding-the-webcontext) through precise core management using plugins.

## `store`

`store: ReactiveMap`

The `store` property is a reactive map where values can be stored and shared among all web components. It serves as a global state accessible by all components. Values can be set and retrieved using the `store.set`, `store.delete`, `store.get` and `store.has` methods.

Example setting a value:

```ts
store.set("count", 0);
```

Example getting a value:

```tsx
<div>{store.get("count")}</div>
```

For more details, refer to the [store](/building-your-application/components-details/web-components#store-store-method) documentation.

### `setOptimistic`

## `useContext`

`useContext: <T>(context: BrisaContext<T>) => { value: T }`

The `useContext` method is used to consume a context value. It takes a `BrisaContext` as a parameter and returns a signal containing the context value. The context value is often used for passing data between a provider and multiple consumers within a component tree.

Example:

```tsx
const foo = useContext(context);
return <div>{foo.value}</div>;
```

For more details, refer to the [context](/building-your-application/components-details/context) documentation.

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

For more details, refer to the [state](/building-your-application/components-details/web-components#state-state-method) documentation.

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

For more details, refer to the [derived](/building-your-application/components-details/web-components#derived-state-and-props-derived-method) documentation.

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

For more details, refer to the [effect](/building-your-application/components-details/web-components#effects-effect-method) documentation.

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

For more details, refer to the [cleanup](/building-your-application/components-details/web-components#clean-effects-cleanup-method) documentation.

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

For more details, refer to the [onMount](/building-your-application/components-details/web-components#effect-on-mount-onmount-method) documentation.

## `indicate`

`indicate(actionName: string): IndicatorSignal`

The `indicate` method is used to add it in the `indicator` HTML extended attribute. This `indicator` automatically set the `brisa-request` class while the indicated server action is pending.

```tsx
const pending = indicate('some-server-action-name');
// ...
css`
 span { display: none }
 span.brisa-request { display: inline }
`
// ...
<span indicator={pending}>Pending...</span>
```

You can also consume it as a signal to know if the server action is pending and to have more control inside the web component.

```tsx
const  = indicate('some-server-action-name');
// ...
{pending.value && <span>Pending...</span>}
```

### Parameters:

- `string` - Indicator name. It can refer to the server action. The idea is that you can use the same indicator in other components (both server and web) using the same name to relate it to the same server action.

For more details, take a look to:

- [`indicate`](/api-reference/components/request-context#indicate) in server components, similar method but from [`RequestContext`](/api-reference/components/request-context).
- [`indicate[Event]`](/api-reference/extended-html-attributes/indicateEvent) HTML extended attribute to use it in server components to register the server action indicator.
- [`indicator`](/api-reference/extended-html-attributes/indicator) HTML extended attribute to use it in any element of server/web components.

## `reset`

`reset(): void`

The `reset` method is used to invoke all cleanup functions and clear all effects and cleanups from the memory of the web component. It is primarily intended for internal use and is exposed but may have limited applicability in many cases.

Example:

```ts
reset();
```

> [!CAUTION]
>
> The `reset` method is a powerful tool that should be used judiciously. It clears all effects and cleanups, potentially affecting the web component's behavior. Ensure that its usage aligns with the desired functionality and doesn't compromise the integrity of the web component.

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

For more details, refer to the [Template literal `css`](/building-your-application/components-details/web-components#template-literal-css) documentation.

## `i18n`

`i18n: I18n`

The `i18n` object provides utilities for accessing the locale and consuming translations within components.

Example:

```tsx
const { t, locale } = i18n;
return <div>{t("hello-world")}</div>;
```

For more details, refer to the [i18n](/building-your-application/routing/internationalization) documentation.

## `route`

`route: Route`

The `route` object provides access to the current route's `name`, `pathname`, `params`, and `query`. 

Example:

```tsx
const { name, pathname, params, query } = route;
```

> [!TIP]
>
> The `route` object is available in both server-side rendering (SSR) and client-side rendering (CSR).

## `self`

`self: HTMLElement`

The `self` property in the `WebContext` provides access to the DOM element of the web component. It allows developers to interact directly with the component's rendered output, enabling manipulation and customization.

Example:

```tsx
self.addEventListener("click", () => {
  console.log("Web component clicked!");
});
```

> [!CAUTION]
>
> It is important to exercise caution when directly manipulating the DOM element using the `self` property. This approach can lead to potential issues, such as conflicts with the reactive nature of Brisa components. Therefore, it is recommended to use this property judiciously and only when necessary.

> [!NOTE]
>
> It is an empty object during SSR to use it in some specific cases like [reseting `shadowRoot.adoptedStyleSheets`](/building-your-application/styling/web-components#global-styles-in-web-components). Normally it is better to use it inside an [`effect`](#effect) to ensure that is executed only in the client-side.

## Expanding the WebContext

The `WebContext` in Brisa is intentionally designed to be extensible, providing developers with the flexibility to enhance its capabilities based on project-specific requirements. This extensibility is achieved through the integration of plugins, which are custom functionalities injected into the core of each web component.

### Web Context Plugins

To add plugins, you must add them in the `webContextPlugins` named export of the `/src/web-components/_integrations.(ts|tsx|js|jsx)` file.

**Params**:

Receives the preceding `WebContext`. Plugins are executed sequentially; if it is the initial plugin, it will contain the original `WebContext`, whereas for subsequent plugins, it will incorporate the `WebContext` modified by the preceding plugin.

**Return**:

The output will be the `WebContext` extended by the functionalities implemented in your plugin.

> [!CAUTION]
>
> It is imperative to consistently return the remaining context properties to prevent potential disruptions in web-component functionality.

> [!CAUTION]
>
> Note that the `WebContext` is utilized in server-side rendering (SSR) as well. Take this into consideration, as certain extensions may not be suitable for server-side usage. Therefore, it is recommended to employ `typeof window === 'undefined'` to determine if the code is running on the server.

### Example: Tab Synchronization

**src/web-components/\_integrations.tsx:**

```tsx
import type { WebContextPlugin } from "brisa";

export const webContextPlugins: WebContextPlugin[] = [
  (ctx) => {
    ctx.store.sync = (
      key: string,
      storage: "localStorage" | "sessionStorage" = "localStorage",
    ) => {
      // Skip execution on server side (SSR)
      if (typeof window === "undefined") return;

      // Sync from storage to store
      const sync = (event?: StorageEvent) => {
        if (event && event.key !== key) return;
        const storageValue = window[storage].getItem(key);
        if (storageValue != null) ctx.store.set(key, JSON.parse(storageValue));
      };

      // Add and remove "storage" event listener
      ctx.effect(() => {
        window.addEventListener("storage", sync);
        ctx.cleanup(() => window.removeEventListener("storage", sync));
      });

      // Update storage when store changes
      ctx.effect(() => {
        const val = ctx.store.get(key);
        if (val != null) window[storage].setItem(key, JSON.stringify(val));
      });

      sync();
    };

    // The ctx now has a new method "sync" that can be used to sync a
    // store key with localStorage
    return ctx;
  },
];
```

In this example, the behavior of the `store` property is modified, enabling any web component to possess the `store` with an additional `sync` method. This method facilitates reactive synchronization of a store entry with the `localStorage`. If another tab modifies the value, the update will be reflected reactively in the DOM.

In any web component:

```tsx
export default async function WebComponent({ }, { store }: WebContext) {
  store.sync("count", 'localStorage');

  // This value will change reactively if the localStorage
  // "count" item is updated.
  return store.get('count');
```

The approach to synchronizing tabs can be implemented in various ways: using web sockets, monitoring tab focus, or utilizing storage events, as demonstrated in this example. From Brisa's perspective, implementing specific signals for such scenarios might be too project-specific. Therefore, we offer the flexibility to extend these signals and access web component core extras for greater control.

### Example: Reactive URL Params

This is another example to have `params` of the `url` reactive, working with SPA navigation, for example for filtering a list of items using the URL query parameters as state:

**src/web-components/\_integrations.tsx**

```tsx
import type { WebContext, WebContextPlugin } from "brisa";

function paramsPlugin(ctx: WebContext) {
  Object.assign(ctx, {
    get params() {
      let params = ctx.state<{ [k: string]: string }>();

      ctx.effect(() => {
        params.value = Object.fromEntries(
          new URLSearchParams(window.location.search).entries(),
        );

        const navigate = (e: any) => {
          params.value = Object.fromEntries(
            new URL(e.destination.url).searchParams.entries(),
          );
        };

        window.navigation?.addEventListener("navigate", navigate);
        ctx.cleanup(
          () => window.navigation?.removeEventListener("navigate", navigate),
        );
      });

      return params;
    },
  });

  return ctx;
}

export const webContextPlugins: WebContextPlugin[] = [paramsPlugin];
```

Usage:

```tsx
import type { WebContext } from "brisa";

export default function SearchResult({}, { params }: WebContext) {
  return <div>{params.value?.q}</div>;
}
```

> [!TIP]
>
> A web component in the layout is not unmounted after SPA navigation. Therefore, we need the `params` signal to be reactive and update the component when the URL changes.

> [!NOTE]
>
> Ultimately, we believe that the **JavaScript community** will contribute more refined signals than these examples. We encourage developers to share their signals with the community to enhance the Brisa ecosystem.

### TypeScript

To extend the `WebContext` interface in TypeScript, create a file in the root and define the typings for your extensions:

**web-context.d.ts:**

```ts
import "brisa";

declare module "brisa" {
  interface WebContext {
    /**
     * Augmented store with sync method
     */
    store: BaseWebContext["store"] & {
      sync: (key: string, storage?: "localStorage" | "sessionStorage") => void;
    };

    /**
     * Reactive URL params
     */
    params: Signal<{ [k: string]: string }>;
  }
}
```

Modify the `WebContext` accordingly, and if you wish to utilize elements like the current store, you can leverage the `BaseWebContext`.
