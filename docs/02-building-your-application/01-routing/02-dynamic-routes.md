---
title: Dynamic Routes
description: Dynamic Routes are pages that allow you to add custom params to your URLs. Start creating Dynamic Routes and learn more here.
---

When you don't know the exact segment names ahead of time and want to create routes from dynamic data, you can use Dynamic Segments that are filled in at request time.

## Convention

A Dynamic Segment can be created by wrapping a folder's name in square brackets: `[folderName]`. For example, `[id]` or `[slug]`.

Dynamic Segments can be accessed from [`request context`](/docs/building-your-application/data-fetching/request-context).

## Example

For example, a blog could include the following route `src/pages/blog/[slug].js` where `[slug]` is the Dynamic Segment for blog posts.

```jsx
export default function Page(props, { route }) {
  return <p>Post: {route.query.slug}</p>
}
```

All components can access `route.query` in the same way, not just pages.

| Route                  | Example URL | `params`        |
| ---------------------- | ----------- | --------------- |
| `pages/blog/[slug].js` | `/blog/a`   | `{ slug: 'a' }` |
| `pages/blog/[slug].js` | `/blog/b`   | `{ slug: 'b' }` |
| `pages/blog/[slug].js` | `/blog/c`   | `{ slug: 'c' }` |

## Catch-all Segments

Dynamic Segments can be extended to **catch-all** subsequent segments by adding an ellipsis inside the brackets `[...folderName]`.

For example, `pages/shop/[...slug].js` will match `/shop/clothes`, but also `/shop/clothes/tops`, `/shop/clothes/tops/t-shirts`, and so on.

| Route                     | Example URL   | `params`                    |
| ------------------------- | ------------- | --------------------------- |
| `pages/shop/[...slug].js` | `/shop/a`     | `{ slug: ['a'] }`           |
| `pages/shop/[...slug].js` | `/shop/a/b`   | `{ slug: ['a', 'b'] }`      |
| `pages/shop/[...slug].js` | `/shop/a/b/c` | `{ slug: ['a', 'b', 'c'] }` |

## Optional Catch-all Segments

Catch-all Segments can be made **optional** by including the parameter in double square brackets: `[[...folderName]]`.

For example, `pages/shop/[[...slug]].js` will **also** match `/shop`, in addition to `/shop/clothes`, `/shop/clothes/tops`, `/shop/clothes/tops/t-shirts`.

The difference between **catch-all** and **optional catch-all** segments is that with optional, the route without the parameter is also matched (`/shop` in the example above).

| Route                       | Example URL   | `params`                    |
| --------------------------- | ------------- | --------------------------- |
| `pages/shop/[[...slug]].js` | `/shop`       | `{}`                        |
| `pages/shop/[[...slug]].js` | `/shop/a`     | `{ slug: ['a'] }`           |
| `pages/shop/[[...slug]].js` | `/shop/a/b`   | `{ slug: ['a', 'b'] }`      |
| `pages/shop/[[...slug]].js` | `/shop/a/b/c` | `{ slug: ['a', 'b', 'c'] }` |