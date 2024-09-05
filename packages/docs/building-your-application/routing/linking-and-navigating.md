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

By default, without the [`renderMode`](/api-reference/extended-props/renderMode) attribute, it acts with the `reactivity` mode. This means that it does a diff of the DOM between the new document and the current one, thus maintaining the states of the web components that are still visible (either because they are in the layout or because we are navigating to the same page in another language) and the store signal between pages.

Although it is a DOM diff it works with incremental rendering, that is to say, that if the following page uses suspense, when processing the diff with HTML streaming the suspense mode continues working.

> [!TIP]
>
> The `reactivity` updates only the content of the page that has changed, keeping the rest of the page intact. This is useful for maintaining the state of the web components that are still visible.

> [!NOTE]
>
> **Good to know**:
>
> With `reactivity` render mode (like SPA), we prioritizes the **preservation of `<body>` attributes** during the HTML diffing process. This design choice grants developers greater control over runtime modifications, such as themes, fonts, and other display properties managed through `BODY` tag attributes.
>
> Many of these decisions are actions performed by users at runtime. It would be disruptive if a user changed the theme of the page, only for that change to be lost upon navigation.

## Navigation with transition

There are times when we want to make transition animations between one page and another. To achieve this we can use the [`renderMode`](/api-reference/extended-props/renderMode) attribute of `<a>` to specify that this navigation uses the [View Transition AP](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API).

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

If we want to force the navigation to be native (that of the browser, without simulating SPA), we can indicate it with the [`renderMode`](/api-reference/extended-props/renderMode) attribute:

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

> [!NOTE]
>
> Modifying the [**`history`**](https://developer.mozilla.org/en-US/docs/Web/API/History) Web API always acts as `native` navigation, bypassing `reactivity` and `transition` modes.

> [!TIP]
>
> To have the URL `params` as a signal, take a look this [example](/api-reference/components/web-context#example-reactive-url-params).

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

If you have [i18n routing](/building-your-application/routing/internationalization) enabled, during navigation you always have to forget about route translations and during the render of the page will be translated to correct translated page.

```jsx
export default function Home() {
  return <a href="/about">About Us</a>;
}
```

In English:

- `/about` → `/en/about` → `src/pages/about.js`

In Spanish:

- `/about` → `/es/sobre-nosotros` → `src/pages/about.js`

> [!IMPORTANT]
>
> For pathname translations, we recommend using server components to avoid the need for client-side translations, however, if you need to use client-side translations, you can use the [`pages.config.transferToClient`](/building-your-application/routing/internationalization#activate-page-pathname-translation-in-web-components) configuration property to transfer the needed page pathnames translations to the client.

### Navigate to another locale

It is always possible to force a specific route in case you want to change the locale to another one:

```jsx
export default function Home() {
  return <a href="/es/sobre-nosotros">About Us in Spanish</a>;
}
```

> [!TIP]
>
> If you are changing the current page locale and you have translations in the client-side, to avoid any issues with the translations, we recommend using the [`renderMode="native"`](#navigation-in-native-way) attribute to force to reload all the translations and `href` links that are setted on client-side _(they are not reactive with signals)_.

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
- If used inside a **client-event** or a **server-event** ([action](/building-your-application/data-management/server-actions)) a new page is always generated in the **navigation history**.

> [!NOTE]
>
> All [i18n](#i18n-navigation) navigaton rules apply equally in this function.

> [!TIP]
>
> `navigate('/some')` does not require you to use `return navigate('/some')` due to using the TypeScript [`never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) type.

## Prefetch

Prefetching is a technique used in web browsing to enhance the user experience by proactively loading resources before they are explicitly requested by the user. When a user visits a webpage, their browser typically fetches resources such as HTML files, CSS stylesheets, JavaScript files, images, and other assets required to render the page. Prefetching allows the browser to anticipate the user's next actions and fetch resources that are likely to be needed soon.

Prefetching can significantly improve perceived page load times and responsiveness, especially on high-latency networks or devices with limited processing power. However, it's essential to implement prefetching judiciously to avoid unnecessary bandwidth consumption and ensure that prefetching does not interfere with other critical tasks, such as fetching resources for the currently viewed page.

To apply the prefetch we can apply it thanks to the [`Head`](/building-your-application/routing/pages-and-layouts.html#head) component of the page:

```tsx
export function Head({}, { route }: RequestContext) {
  return (
    <>
      <link rel="prefetch" href="/foo"></link>
    </>
  );
}

export default function Page() {
  return <a href="/foo">Navigate to foo</a>;
}
```

In this above example, when navigating to `/foo` the result will be immediate because the request has already been processed.

> [!NOTE]
>
> The i18n is managed in the same way as the links, so if `/foo` in Spanish is called `/bar`, it will automatically convert `/foo` to `/es/bar`.

Consider an e-commerce website with a multi-step checkout process consisting of distinct pages for entering shipping information, payment details, and order confirmation. By implementing prefetching, we can ensure that each step of the checkout process loads instantly as the user progresses, providing a seamless and frictionless experience.

> [!NOTE]
>
> For more information access the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch).

> [!WARNING]
>
> Although it is implemented in all browsers, in Safari and Safari iOS it is under a preference setting, so probably will be users who do not have the prefetch applied to them.

### Prefetch with JavaScript/TypeScript

To prefetch imperatively with JavaScript or TypeScript, you can do it from the Web Components with the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) method. As in production the pages have this header:

```
Cache-Control:
no-store, must-revalidate, public, max-age=3600
```

They are cached for 1 hour.

Therefore, you can use the fetch without processing the response, only as a prefetch to ensure that during navigation it pulls the cache.

Example:

```tsx
export default function SomeWebComponent() {
  // The prefetch don't need await because we are not processing the response in this
  fetch("/foo");
  return <a href="/foo">Navigate to foo</a>;
}
```

> [!WARNING]
>
> The imperative `prefetch` using `fetch` doesn't work in Server Components. For Server Components you can use the the [`link`](#prefetch) element.

> [!WARNING]
>
> The imperative `prefetch` using `fetch` don't translate i18n pages, so you need to manage with the [`i18n`](/api-reference/components/web-context#i18n) info from the [`WebContext`](/api-reference/components/web-context).

### Speculation Rules for prerendering

The Chrome team has reintroduced full prerendering capabilities to enhance page load times by speculating which pages a user might navigate to next. This new mechanism uses the Speculation Rules API, allowing developers to programmatically prerender pages. This guide will show you how to use this API to prerender a page when a user hovers over a link.

Example:

```html
<script type="speculationrules">
  {
    "prerender": [
      {
        "where": {
          "href_matches": "/*"
        },
        "eagerness": "moderate"
      }
    ]
  }
</script>
```

In this example:

1. The speculation rule is defined within a `<script type="speculationrules">` tag.
2. The rule specifies that all URLs matching the pattern /\* should be prerendered.
3. The eagerness property is set to moderate, which means that speculation will be triggered when the user hovers over a link for 200 milliseconds or on the pointerdown event (useful for mobile devices where hover events are not applicable).

This setup ensures that prerendering happens efficiently and only when there is a high likelihood of the user navigating to those pages based on their interaction with the links.

> [!NOTE]
>
> For more information access the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API).
