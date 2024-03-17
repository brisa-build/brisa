---
description: Override and extend the built-in Error page to handle custom errors.
---

# Custom Errors

## 404 Page

To create a custom 404 page you can create a `src/pages/_404.js` file.

```jsx filename="src/pages/_404.js"
export default function Custom404() {
  return <h1>404 - Page Not Found</h1>;
}
```

This page will be displayed when the user tries to access a page that does not exist.

> [!TIP]
>
> In this page you can access to the `request context`, `fetch` data, change the `head` content (meta tags, etc), and change the `response headers`, in the same way of the rest of pages.

## `notFound` function

The [`notFound`](/api-reference/functions/notFound) function allows you to render the [`404 page`](#404-page) within a route segment as well as inject a `<meta name="robots" content="noindex" />` tag.

Invoking the `notFound()` function throws a `NotFoundError` error and terminates rendering of the route segment in which it was thrown.

```jsx filename="src/pages/user/[id].tsx"
import { RequestContext } from "brisa";
import { notFound } from "brisa";

async function fetchUser(id) {
  const res = await fetch("https://...");
  if (!res.ok) return undefined;
  return res.json();
}

export default async function UserProfile({}, req: RequestContext) {
  const user = await fetchUser(req.route.params.id);

  if (!user) {
    notFound();
  }

  // ...
}
```

Useful to control response status during streaming:

- **Before response streaming** (`middleware`, `responseHeaders`): It's returning the response with 404 status and the 404 page
- **During response streaming** (`layout`, `page`, `components`): Adds the `meta` tag with `noindex`, stop rendering the page and sends a client script to replace the page to the 404 page. This redirect is for UX to display the 404 content, here the bots will no longer see that because it has the noindex. However, this soft redirect that is done on the client does not change the browsing history and does receive the 404 status. The browsers normally cache very well the pages that return status 404.
- **During a [server action](/components-details/server-actions):** (server events captured with actions): as the rendering has already been done and it is a post-render action, the 404 in an action acts similarly as in the middle of the streaming. The same happens if in the action instead of calling `notFound()` directly you do a rerender and the component calls `notFound()`.

> [!TIP]
>
> `notFound()` does not require you to use `return notFound()` due to using the TypeScript [`never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) type.

## 500 Page

To customize the 500 page you can create a `src/pages/_500.js` file.

```jsx filename="src/pages/_500.js"
export default function Custom500({ error }, requestContext) {
  return <h1>500 - {error.message}</h1>;
}
```

> [!TIP]
>
> In this page you can access to the `request context`, `fetch` data, change the `head` content (meta tags, etc), and change the `response headers`, in the same way of the rest of pages.

### Errors in component-level

If you want to control errors at the component level instead of displaying a whole new page with the error, you can make the components have the error extension by adding the `ComponentName.error`:

Example [server component](/components-details/server-components):

```tsx
import { RequestContext } from "brisa";

export default function SomeServerComponent() {
  /* some JSX */
}

SomeServerComponent.error = (
  { error, ...props },
  requestContext: RequestContext,
) => {
  return <p>Oops! {error.message}</p>;
};
```

Example [web component](/components-details/web-components):

```tsx
import { WebContext } from "brisa";

export default function SomeWebComponent() {
  /* some JSX */
}

SomeWebComponent.error = ({ error, ...props }, webContext: WebContext) => {
  return <p>Oops! {error.message}</p>;
};
```

This works for both server and web components. The difference is that web-components have access to the [webContext](/building-your-application/data-fetching/web-context) while server-components have access to the [requestContext](/building-your-application/data-fetching/request-context).
