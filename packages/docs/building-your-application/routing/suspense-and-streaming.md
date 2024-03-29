---
description: Suspense allows you to create a fallback for any component, and automatically stream content as it becomes ready.
---

# Suspense and Streaming

Each component (server-component and web-component) allows an extension to add a `suspense` component to it, which is the fallback that will be displayed while the component loads.

```js
SomeComponent.suspense = ({}, { i18n }) => {
  return <div>{i18n.t('loading-message')...}</div>
}
```

## Suspense during Streaming

The HTML of the page is served with small chunks during the streaming. Streaming is particularly beneficial when you want to prevent long data requests from blocking the page from rendering as it can reduce the [Time To First Byte (TTFB)](https://web.dev/ttfb/) and [First Contentful Paint (FCP)](https://web.dev/first-contentful-paint/). It also helps improve [Time to Interactive (TTI)](https://developer.chrome.com/en/docs/lighthouse/performance/interactive/), especially on slower devices.

If there is **no** `suspense`:

- It will wait to load each component and will be sending the HTML chunks returned by each component.

If **some** component has `suspense`:

- This component will not block other components, it will show the fallback that returns the suspense (pending state) and once it is loaded the content is replaced on the fly during the streaming.

### Example

In this example we are registering `suspense` to display a loading state meanwhile the user of `SomeComponent` is not loaded. After add the `suspense` it does not block and keeps sending more chunks of the HTML while the component is loading. Once the component is loaded then the fallback will be replaced by the original content. In case it fails, we could also display another type of content using the `error` component extension.

```tsx filename="src/components/some-component.tsx" switcher
import { type RequestContext } from "brisa";

// If it does not have the suspense, it waits to show the content, otherwise, it puts it in suspense and is displayed once is available
export default async function SomeComponent({}, { store, i18n }: RequestContext) {
  const { t } = i18n
  const user = await getUser();
  const message = t('hello-username', { username: user.username })

  // Save user inside the store to avoid prop drilling
  store.set('user', user);

  return <Card title={message}><UserContent /></Card>
}

// Adding suspense:
// Rendering this meanwhile SomeComponent is pending
SomeComponent.suspense = ({}, { i18n }: RequestContext) => {
  return <div>{i18n.t('loading-message')...}</div>
}

// Rendering this when throws an error
SomeComponent.error = ({ error }) => {
  return <div>Oops! {error.message}</div>
}
```

```jsx filename="src/components/some-component.jsx" switcher
// If it does not have the suspense, it waits to show the content, otherwise, it puts it in suspense and is displayed once is available
export default async function SomeComponent({}, { store, i18n }) {
  const user = await getUser();
  const message = i18n.t('hello-username', { username: user.username })

  // Save user inside the store to avoid prop drilling
  store.set('user', user);

  return <Card title={message}><UserContent /></Card>
}

// Adding suspense:
// Rendering this meanwhile SomeComponent is pending
SomeComponent.suspense = ({}, { i18n }) => {
  return <div>{i18n.t('loading-message')...}</div>
}

// Rendering this when throws an error
SomeComponent.error = ({ error }) => {
  return <div>Oops! {error.message}</div>
}
```

### SEO

- Since streaming is server-rendered, it does not impact SEO. You can use the [Mobile Friendly Test](https://search.google.com/test/mobile-friendly) tool from Google to see how your page appears to Google's web crawlers and view the serialized HTML ([source](https://web.dev/rendering-on-the-web/#seo-considerations)).

## Suspense differences between server/web components

Both server/web components use suspense during streaming.

### Suspense in Web-components

By default all **web-components** are **Server Side Rendered**. Unless you use the `skipSSR={true}` attribute when consuming it:

```tsx
<my-web-component skipSSR />
```

Web-components have another benefit of suspense, and that is that it is applied dynamically as well, this means that if you have web-components that are not displayed in the initial HTML but are dynamically displayed later after a user interaction and need to do something asynchronous to load data, the content defined in the "suspense" will be displayed while loading this data.

**`src/web-components/my-web-component.tsx`**:

```tsx
export default async function MyWebComponent({}, { state }) {
  const foo = await fetch(/* ... */).then((r) => r.text());

  return <div>{foo}</div>;
}

MyWebComponent.suspense = (props, webContext) => <div>loading...</div>;
```

You can do a `fetch` in the render because in Brisa there are no rerenders, so it will always run only once mouting the component.

Another benefit of web-components is the suspense defined therein is reactive to `props`, `state`, `context` and `store`. So you can make it interactive from the client if you need to.

Example displaying different texts during suspense using [`store`](docs/components-details/web-components#store):

```tsx
import { WebContext } from "brisa";

export default async function MyWebComponent({}, { store }: WebContext) {
  store.set("suspense-message", "Loading step 1 ...");
  const firstResponse = await fetch(/* ... */);
  store.set("suspense-message", "Loading step 2 ...");
  const secondResponse = await fetch(/* ... */);

  return (
    <div>
      {firstResponse.foo} {secondResponse.bar}
    </div>
  );
}

// Display reactive messages from context during the suspense phase:
MyWebComponent.suspense = ({}, { store }: WebContext) => {
  return store.get("suspense-message");
};
```

Also works during streaming. Although loading data is done at the client-side. That is, the `suspense` is rendered on the server with SSR, and on the client-side the real component is loaded by updating the suspense phase until it has the content. That is, these **`fetch`** inside the component will **never be done from the server** in the case of web-components.

### Transitions between suspense-content

There is an important difference between the web and server components when it comes to making transitions between the suspense phase and the real content.

The suspense phase **by default does not support animations** as it is replaced by the real content, so if you need to implement animations during these phases you can do it with two different strategies.

#### First strategy: Using store signals (Web Components)

The first strategy is to continue using the suspense offered by Brisa but use the store to communicate between the two phases.

```tsx
import type { WebContext } from "brisa";

export default async function WebComponent({}, { store }: WebContext) {
  // Wait the delay (fetch, whatever)
  const data = await fetch(/* */).then((r) => r.json());

  // Start the animation to replace the content
  await transitionOnSuspense(store, 200);

  return <div class="start">{data.content}</div>;
}

WebComponent.suspense = ({}, { store }: WebContext) => {
  return (
    <div class={store.get("content-ready") ? "exit" : ""}>Loading ....</div>
  );
};

async function transitionOnSuspense(store: WebContext["store"], duration) {
  store.set("content-ready", true);
  // Wait for the suspense transition to finish
  await new Promise((resolve) => setTimeout(resolve, duration));
}
```

Example of css:

```css
@keyframes start {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes exit {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.exit {
  animation: exit 200ms;
}
.start {
  animation: start 200ms;
}
```

> [!WARNING]
>
> Only works in **Web Components**.

#### Second strategy: Using async generators (Server Components)

The second strategy is instead of using the suspense that Brisa offers, to use the async generator together with the [`css`](/building-your-application/data-fetching/request-context#css) helper to inject styles after the suspense phase to hide them with an animation.

```tsx
import type { RequestContext } from "brisa";

async function* ServerComponent({}, { css }: RequestContext) {
  yield <div class="suspense">Loading ....</div>;

  // Wait the delay (fetch, whatever)
  const data = await fetch(/* */).then((r) => r.json());

  // Start the animation to replace the content
  css`
    @keyframes slideaway {
      from {
        display: block;
      }
      to {
        transform: translateY(40px);
        opacity: 0;
      }
    }

    .suspense {
      animation: slideaway 200ms;
      display: none;
    }

    @keyframes slidein {
      from {
        transform: translateY(40px);
        opacity: 1;
      }
      to {
        display: block;
      }
    }

    .content {
      animation: slidein 200ms;
    }
  `;

  // Yield the real content
  yield <div class="content">{data.content}</div>;
}
```

> [!WARNING]
>
> Only works in **Server Components**.
