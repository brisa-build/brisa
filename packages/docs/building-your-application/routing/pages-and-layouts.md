---
description: Create your first page and shared layout with the Pages Router.
---

# Pages and Layouts

The Pages Router has a file-system based router built on the concept of pages (like Next.js pages folder).

When a file is added to the `pages` directory, it's automatically available as a route.

In Brisa framework, a **page** is a [Brisa Server Component](/building-your-application/components-details/server-components) exported from a `.js`, `.jsx`, `.ts`, or `.tsx` file in the `pages` directory. Each page is associated with a route based on its file name.

**Example**: If you create `pages/about.js` that exports a Brisa component like below, it will be accessible at `/about`.

```jsx
export default function About() {
  return <div>About</div>;
}
```

See the difference between Brisa Components and React Components [here](/building-your-application/components-details/server-components).

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
>
> To learn more about dynamic routing, check the [Dynamic Routing documentation](/building-your-application/routing/dynamic-routes).

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

The `fetch` is directly native and has no wrapper to control the cache. We recommend that you do not do the same `fetch` in several places, but use the [`store`](/api-reference/components/request-context) to store the data and consume it from any component.

> [!TIP]
>
> async generators are also supported if you want to stream every item in a list for example:
>
> ```tsx
> async function* List() {
>   yield <li>{await foo()}</li>;
>   yield <li>{await bar()}</li>;
>   yield <li>{await baz()}</li>;
> }
> ```
>
> This can be used as a server component:
>
> ```tsx
> return <List />;
> ```
>
> And the HTML is resolved via streaming.

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
    "Content-Security-Policy": "script-src 'self' 'unsafe-inline';",
    "X-Example": "This header is added from layout",
  };
}
```

```js filename="middleware.js" switcher
export function responseHeaders(request, responseStatus) {
  return {
    "Cache-Control": "public, max-age=3600",
    "Content-Security-Policy": "script-src 'self' 'unsafe-inline';",
    "X-Example": "This header is added from layout",
  };
}
```

## Head

The `Head` is a method that you can export in the pages to overwrite any element of the `<head>` tag.

If for example you have the `title` defined in the layout but in the page `/about-us` you want to put a different title. You can use the same `id` to override the title of the layout:

```tsx
export function Head({}, { route }: RequestContext) {
  return (
    <>
      <title id="title">About us</title>
      <link rel="canonical" href="https://my-web.com" />
    </>
  );
}

export default function AboutUsPage() {
  // ...
}
```

> [!NOTE]
>
> If you want to mash existing head fields (title, link, meta, etc) because you already have them defined in the layout, you must use the `id` attribute in both parts, and only this one will be rendered. On pages that do not overwrite it, the one in the layout will be rendered.

## Share data between `middleware` → `layout` → `page` → `component` → `responseHeaders` → `Head` → `web-components`

You can share data between different parts of the application using the [`request context`](/api-reference/components/request-context).

```tsx filename="layout/index.tsx" switcher
import { type RequestContext } from "brisa";

export default async function Layout({}, request: RequestContext) {
  const data = await getData(request);

  request.store.set("data", data);

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

export default function SomeComponent(props: Props, { store }: RequestContext) {
  const data = store.get("data");

  return <h1>Hello {data[props.name]}</h1>;
}
```

### Transfer data to client (web-components):

This data is only available on the server. So you can store sensitive data without worrying. However, you can transfer certain data to the client side (web-components) using `store.transferToClient` method.

```tsx
import { type RequestContext } from "brisa";

export default async function Layout({}, request: RequestContext) {
  const data = await getData(request);

  request.store.set("data", data);

  // Transfer "data" from store to client
  request.store.transferToClient(["data"]);

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

This allows access to these values from the web components store.

This setup also enables subsequent [server actions](/building-your-application/data-management/server-actions) to access the same `store`, as the communication flows through the client:

`server render` → `client` → `server action` → `client`

It is a way to modify in a reactive way from a server action the web components that consume this `store`.

> [!NOTE]
>
> You can [encrypt store data](/building-your-application/data-management/server-actions#transfer-sensitive-data) if you want to transfer sensitive data to the server actions so that it cannot be accessed from the client.

### Consume data on client (web-components):

In the web-components instead of the [`RequestContext`](/api-reference/components/request-context), there is the [`WebContext`](/api-reference/components/web-context), where you have a different [`store`](/building-your-application/components-details/web-components#store-store-method), but if you have transferred the data from the `RequestContext` `store`, you will be able to consume it from the `WebContext` `store`.

```tsx
import { WebContext } from "brisa";

export default function WebComponent({}, { store }: WebContext) {
  return <button onClick={() => alert(store.get("example"))}>Click</button>;
}
```

If you want to know more about `store` [check this out](/building-your-application/components-details/web-components#store-store-method).
