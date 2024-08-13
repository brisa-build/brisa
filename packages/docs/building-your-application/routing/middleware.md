---
description: Learn how to use Middleware to run code before a request is completed.
---

# Middleware

Middleware allows you to run code before a request is completed. Then, based on the incoming request, you can modify the response by rewriting, redirecting, modifying the request or response headers, or responding directly.

Middleware runs before routes are matched.

## Convention

Use the file `middleware.ts` (or `.js`) inside the `src` folder of your project to define Middleware. Or inside `src/middleware/index.ts` (or `.js`).

## Example

:::tabs key:language
==TypeScript

```ts
// middleware.ts
import { type RequestContext } from "brisa";

// This function can be without `async` if you are not using `await` inside
export default async function middleware({
  i18n,
  route,
  headers,
}: RequestContext): Response | undefined {
  const { locale } = i18n;
  const isUserRoute = route?.name?.startsWith("/user/[username]");

  if (isUserRoute && !(await isUserLogged(headers))) {
    return new Response("", {
      status: 302,
      headers: {
        Location: `/${locale}/login`,
      },
    });
  }
}
```

==JavaScript

```js
// middleware.js
// This function can be without `async` if you are not using `await` inside
export default async function middleware({ i18n, route, headers }) {
  const { locale } = i18n;
  const isUserRoute = route?.name?.startsWith("/user/[username]");

  if (isUserRout && !(await isUserLogged(headers))) {
    return new Response("", {
      status: 302,
      headers: {
        Location: `/${locale}/login`,
      },
    });
  }
}
```

:::

Only is possible to access to `route` property inside `api routes` and `pages routes`. This is to support handling of dynamic routes, catch-all, etc in a simple way. In the case of `assets` you can look it up through the request:

:::tabs key:language

==TypeScript

```ts
import { type RequestContext } from "brisa";

export default async function middleware(
  request: RequestContext,
): Response | undefined {
  const url = new URL(request.url);

  if (url.pathname === "/favicon.svg") {
    return new Response(
      `
      <svg>
        <rect width="100" height="100" fill="red" />
      </svg>
    `,
      {
        headers: { "content-type": "image/svg+xml" },
      },
    );
  }
}
```

==JavaScript

```js
export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === "/favicon.svg") {
    return new Response(
      `
      <svg>
        <rect width="100" height="100" fill="red" />
      </svg>
    `,
      {
        headers: { "content-type": "image/svg+xml" },
      },
    );
  }
}
```

:::

However, this is not the best way to serve assets. You can put the static files directly inside the `public` folder. More information [here](/building-your-application/routing/static-assets).

## Cookies & Headers

### On Request

Cookies are regular headers. On a `Request`, they are stored in the `Cookie` header.

:::tabs key:language
==TypeScript

```ts
import { type RequestContext } from "brisa";

export default async function middleware(request: RequestContext) {
  const cookies = request.headers.get("cookie");
  const headers = request.headers.get("x-example");

  // ... do something with cookies and headers
}
```

==JavaScript

```js
export default async function middleware(request) {
  const cookies = request.headers.get("cookie");
  const headers = request.headers.get("x-example");

  // ... do something with cookies and headers
}
```

:::

### On Response

The `responseHeaders` function can be exported in the `middleware`, in the same way that you can do it inside `layout` and `pages`.

All responseHeaders will be mixed in this order:

1. `middleware` response headers
2. `layout` response headers (can crush the middleware response headers)
3. `page` response headers (both middleware and layout response headers can be mixed).

:::tabs key:language
==TypeScript

```ts
import { type RequestContext } from "brisa";

export function responseHeaders(
  request: RequestContext,
  responseStatus: number,
) {
  return {
    "Cache-Control": "public, max-age=3600",
    "X-Example": "This header is added from middleware",
  };
}
```

==JavaScript

```js
export function responseHeaders(request, responseStatus) {
  return {
    "Cache-Control": "public, max-age=3600",
    "X-Example": "This header is added from middleware",
  };
}
```

:::

## Share data between `middleware` → `layout` → `page` → `component` → `responseHeaders`

You can share data between different parts of the application using the [`store`](/api-reference/components/request-context#store).

```ts filename="middleware.ts" switcher
import { type RequestContext } from "brisa";

export default async function middleware(request: RequestContext) {
  const data = await getData(request);

  request.store.set("data", data);
}
```

```tsx filename="components/some-component.tsx" switcher
import { type RequestContext } from "brisa";

type Props = {
  name: string;
};

export default function SomeComponent(props: Props, request: RequestContext) {
  const data = request.store.get("data");

  return <h1>Hello {data[props.name]}</h1>;
}
```

If you want to know more [check this out](/api-reference/components/request-context#store).
