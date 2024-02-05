---
title: Linking and Navigating
description: Learn how navigation works in Brisa.
---

Brisa works with MPA like SPA thanks to [View Transitions](https://github.com/WICG/view-transitions/blob/main/explainer.md), so we will use the native HTML navigation and you can use the `a` tag directly:

```jsx
export default function Home() {
  return (
    <ul>
      <li>
        <a href="/">Home</a>
      </li>
      <li>
        <a href="/about">About Us</a>
      </li>
      <li>
        <a href="/blog/hello-world">Blog Post</a>
      </li>
    </ul>
  );
}
```

The example above uses multiple `a` tags. Each one maps a path (`href`) to a known page:

- `/` → `src/pages/index.js`
- `/about` → `src/pages/about.js`
- `/blog/hello-world` → `src/pages/blog/[slug].js`

## Navigation to dynamic paths

You can also use interpolation to create the path, which comes in handy for [dynamic route segments](/docs/building-your-application/routing/dynamic-routes). For example, to show a list of posts which have been passed to the component as a prop:

```jsx
export default function Posts({ posts }) {
  return (
    <ul>
      {posts.map((post) => (
        <li>
          <a href={`/blog/${encodeURIComponent(post.slug)}`}>{post.title}</a>
        </li>
      ))}
    </ul>
  );
}
```

> [!NOTE]
>
> [`encodeURIComponent`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) is used in the example to keep the path utf-8 compatible.

## I18n navigation

If you have [i18n routing](/docs/routing/internationalization) enabled, during navigation you always have to forget about route translations and during the render of the page will be translated to correct translated page.

```jsx
export default function Home() {
  return <a href="/about">About Us</a>;
}
```

In English:

- `/about` → `/en/about` → `src/pages/about.js`

In Spanish:

- `/about` → `/es/sobre-nosotros` → `src/pages/about.js`

### Navigate to another locale

It is always possible to force a specific route in case you want to change the locale to another one:

```jsx
export default function Home() {
  return <a href="/es/sobre-nosotros">About Us in Spanish</a>;
}
```

## `navigate` function

The `navigate` function is used for imperative navigation.

```ts
import { navigate } from "brisa";

// ...
navigate("/some-page");
```

The `navigate` function can be used both on the client and on the server. Although there are some differences to be taken into account:

- If the navigation is done **before** sending the **response** (in the [middleware](/docs/building-your-application/routing/middleware), [`responseHeaders`](/docs/building-your-application/routing/pages-and-layouts#response-headers-in-layouts-and-pages) or an [API endpoint](/docs/building-your-application/routing/api-routes) for example), instead of modifying the navigation history it does a [**301 redirect**](https://en.wikipedia.org/wiki/HTTP_301).
- If it is done **during rendering**, a [**soft redirect**](https://en.wikipedia.org/wiki/Wikipedia:Soft_redirect) is made.
- If used inside a **client-event** or a **server-event** ([action](/docs/components-details/server-actions)) a new page is always generated in the **navigation history**.

> [!NOTE]
>
> All [i18n](#i18n-navigation) and [dynamic paths](#navigation-to-dynamic-paths) rules apply equally in this function.

> [!TIP]
>
> `navigate('/some')` does not require you to use `return navigate('/some')` due to using the TypeScript [`never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) type.

TODO: Confirm the TIP after implement this task: https://github.com/aralroca/brisa/issues/55

TODO: Implement View transitions https://github.com/WICG/view-transitions/blob/main/explainer.md
