---
title: Pages and Layouts
description: Create your first page and shared layout with the Pages Router.
---

The Pages Router has a file-system based router built on the concept of pages (like Next.js pages folder).

When a file is added to the `pages` directory, it's automatically available as a route.

In Brisa framework, a **page** is a [Brisa Component](/docs/components-details) exported from a `.js`, `.jsx`, `.ts`, or `.tsx` file in the `pages` directory. Each page is associated with a route based on its file name.

**Example**: If you create `pages/about.js` that exports a Brisa component like below, it will be accessible at `/about`.

```jsx
export default function About() {
  return <div>About</div>;
}
```

See the difference between React Components and Brisa Components [here](/docs/components-details).

## Index routes

The router will automatically route files named `index` to the root of the directory.

- `pages/index.js` → `/`
- `pages/blog/index.js` → `/blog`

## Nested routes

The router supports nested files. If you create a nested folder structure, files will automatically be routed in the same way still.

- `pages/blog/first-post.js` → `/blog/first-post`
- `pages/dashboard/settings/username.js` → `/dashboard/settings/username`

## Pages with Dynamic Routes

Brisa supports pages with dynamic routes. For example, if you create a file called `pages/posts/[id].js`, then it will be accessible at `posts/1`, `posts/2`, etc.

> [!NOTE]
> To learn more about dynamic routing, check the [Dynamic Routing documentation](/docs/building-your-application/routing/dynamic-routes).

## Layout

The global layout is defined inside `/src/layout/index`. By default Brisa supports a default layout, but you can modify it here.

```jsx filename="src/layout/index.js"
import { RequestContext } from "brisa";

export default function Layout(
  { children }: { children: JSX.Element },
  { route }: RequestContext
) {
  return (
    <html>
      <head>
        <title>My layout</title>
        <link rel="icon" href="favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

It must have the same structure: `html`, `head` and `body`. If for example you forget to put the `head`, you may have issues and you will be alerted with an error during development.

All the components of Brisa (pages and layouts included), apart from the props, receive a second argument which is the **context of the request**, apart from having access to the request, you have access to a series of extra information such as the **route** of the page. In the layouts, having access to the page route is very useful to **create different layouts**.

### Example of multi-layouts

```tsx filename="src/layout/index.js"
import { type RequestContext } from "brisa";
import UserLayout from './user-layout'
import GlobalLayout from './global-layout'

export default function Layout({ children }: { children: JSX.Element }, { route }: RequestContext) {
  // pathname: /en/user/aralroca/settings or /es/usuario/pepe
  if(route.name.startsWith('/user/[username]')) {
    return <UserLayout>{children}<UserLayout>
  }

  return <GlobalLayout>{children}</GlobalLayout>
}
```

## Data Fetching

Inside your layout, you can fetch data directly with `fetch`, in the same way that you can do it in pages:

```jsx filename="src/layout/index.js"
import { RequestContext } from "brisa";

export default async function Layout(
  { children }: { children: JSX.Element },
  { route }: RequestContext
) {
  const data = await fetch(/* data url */).then((r) => r.json());

  return (
    <html>
      <head>
        <title>My layout</title>
        <link rel="icon" href="favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

The `fetch` is directly native and has no wrapper to control the cache. We recommend that you do not do the same `fetch` in several places, but use the [`context`](/docs/building-your-application/data-fetching/request-context) to store the data and consume it from any component.

## Response headers in layouts and pages

The `responseHeaders` function can be exported inside the `layout` and inside any `page`. In the same way that is possible to export it also in the [`middleware`](docs/building-your-application/routing/middleware).

All `responseHeaders` will be mixed in this order:

1. `middleware` response headers
2. `layout` response headers (can crush the middleware response headers)
3. `page` response headers (both middleware and layout response headers can be mixed).

```ts filename="middleware.ts" switcher
import { type RequestContext } from "brisa";

export function responseHeaders(
  request: RequestContext,
  responseStatus: number,
) {
  return {
    "Cache-Control": "public, max-age=3600",
    "X-Example": "This header is added from layout",
  };
}
```

```js filename="middleware.js" switcher
export function responseHeaders(request, responseStatus) {
  return {
    "Cache-Control": "public, max-age=3600",
    "X-Example": "This header is added from layout",
  };
}
```

## Share data between `middleware` → `layout` → `page` → `component` → `responseHeaders`

You can share data between different parts of the application using the [`request context`](/docs/building-your-application/data-fetching/request-context).

```tsx filename="layout/index.tsx" switcher
import { type RequestContext } from "brisa";

export default async function Layout({}, request: RequestContext) {
  const data = await getData(request);

  request.context.set("data", data);

  return (
    <html>
      <head>
        <title>My page</title>
        <link rel="icon" href="favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

```tsx filename="components/some-component.tsx" switcher
import { type RequestContext } from "brisa";

type Props = {
  name: string;
};

export default function SomeComponent(props: Props, request: RequestContext) {
  const data = request.context.get("data");

  return <h1>Hello {data[props.name]}</h1>;
}
```

If you want to know more [check this out](<(/docs/building-your-application/data-fetching/request-context)>).
