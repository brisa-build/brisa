---
title: Suspense and Streaming
description: Suspense allows you to create a fallback for any server-component, and automatically stream content as it becomes ready.
---

Each server-component allows an extension to add a `suspense` component to it, which is the fallback that will be displayed while the component loads.

```js
SomeComponent.suspense = ({}, { i18n }) => {
  return <div>{i18n.t('loading-message')...}</div>
}
```

> **Good to know**: `suspense` is only supported in **server-components** (default components). Probably if you need to add a `suspense` in a web-component is a sign that the load should be moved to the server.

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
export default async function SomeComponent({}, { context, i18n }: RequestContext) {
  const { t } = i18n
  const user = await getUser();
  const message = t('hello-username', { username: user.username })

  // Save user inside the request context to avoid prop drilling
  context.set('user', user);

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
export default async function SomeComponent({}, { context, i18n }) {
  const user = await getUser();
  const message = i18n.t('hello-username', { username: user.username })

  // Save user inside the request context to avoid prop drilling
  context.set('user', user);

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
