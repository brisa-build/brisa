---
title: Linking and Navigating
description: Learn how navigation works in Brisa.
---

Brisa works with MPA, so we will use the native HTML navigation and you can use the `a` tag directly:

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

## Imperative navigation

TODO
