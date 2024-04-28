---
description: Learn how navigation works in Brisa.
---

# Linking and Navigating

## Navigation with reactivity

Brisa works with MPA like SPA thanks to [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API), so we will use the native HTML navigation and you can use the `a` tag directly:

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

By default, without the [`renderMode`](/api-reference/extended-html-attributes/renderMode) attribute, it acts with the `reactivity` mode. This means that it does a diff of the DOM between the new document and the current one, thus maintaining the states of the web components that are still visible (either because they are in the layout or because we are navigating to the same page in another language) and the store signal between pages.

Although it is a DOM diff it works with incremental rendering, that is to say, that if the following page uses suspense, when processing the diff with HTML streaming the suspense mode continues working.

## Navigation with transition

There are times when we want to make transition animations between one page and another. To achieve this we can use the [`renderMode`](/api-reference/extended-html-attributes/renderMode) attribute of `<a>` to specify that this navigation uses the [View Transition AP](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API).

When using the transitions it still works like the `reactivity` mode, plus the addition of the View Transition API transition. It still works with suspense and HTML streaming.

Example:

```tsx
export default function Home() {
  return (
    <ul>
      <li>
        <a href="/" renderMode="transition">
          Home
        </a>
      </li>
      <li>
        <a href="/about" renderMode="transition">
          About Us
        </a>
      </li>
      <li>
        <a href="/blog/hello-world" renderMode="transition">
          Blog Post
        </a>
      </li>
    </ul>
  );
}
```

To add custom transition animations, you have to do it with CSS and the [view-transition-name](https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name) property.

For example, to change the speed of it:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.5s;
}
```

> [!TIP]
>
> To access the transition with JavaScript/TypeScript you can access the global property `window.lastDiffTransition`

## Navigation in native way

If we want to force the navigation to be native (that of the browser, without simulating SPA), we can indicate it with the [`renderMode`](/api-reference/extended-html-attributes/renderMode) attribute:

```tsx
export default function Home() {
  return (
    <ul>
      <li>
        <a href="/" renderMode="native">
          Home
        </a>
      </li>
      <li>
        <a href="/about" renderMode="native">
          About Us
        </a>
      </li>
      <li>
        <a href="/blog/hello-world" renderMode="native">
          Blog Post
        </a>
      </li>
    </ul>
  );
}
```

By default it is already native in these cases:

- If you use another target, such as `target="_blank"`.
- Using another origin ex: `<a href="https://example.com">`.
- Using the `download` attribute, ex: `<a href="/some-file.pdf" download>`.

## Navigation to dynamic paths

You can also use interpolation to create the path, which comes in handy for [dynamic route segments](/building-your-application/routing/dynamic-routes). For example, to show a list of posts which have been passed to the component as a prop:

```jsx
export default function Posts({ posts }) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
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

If you have [i18n routing](/routing/internationalization) enabled, during navigation you always have to forget about route translations and during the render of the page will be translated to correct translated page.

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

The [`navigate`](/api-reference/functions/navigate) function is used for imperative navigation.

```ts
import { navigate } from "brisa";

// ...
navigate("/some-page");
```

The `navigate` function can be used both on the client and on the server. Although there are some differences to be taken into account:

- If the navigation is done **before** sending the **response** (in the [middleware](/building-your-application/routing/middleware), [`responseHeaders`](/building-your-application/routing/pages-and-layouts#response-headers-in-layouts-and-pages) or an [API endpoint](/building-your-application/routing/api-routes) for example), instead of modifying the navigation history it does a [**301 redirect**](https://en.wikipedia.org/wiki/HTTP_301).
- If it is done **during rendering**, a [**soft redirect**](https://en.wikipedia.org/wiki/Wikipedia:Soft_redirect) is made.
- If used inside a **client-event** or a **server-event** ([action](/components-details/server-actions)) a new page is always generated in the **navigation history**.

> [!NOTE]
>
> All [i18n](#i18n-navigation) navigaton rules apply equally in this function.

> [!TIP]
>
> `navigate('/some')` does not require you to use `return navigate('/some')` due to using the TypeScript [`never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) type.

TODO: Confirm the TIP after implement this task: https://github.com/brisa-build/brisa/issues/55
