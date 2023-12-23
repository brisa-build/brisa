---
title: API Routes
description: Brisa supports API Routes, which allow you to build your API without leaving your Brisa app. Learn how it works here.
---

API routes provide a solution to build a **public API** with Brisa.

Any file inside the folder `src/api` is mapped to `/api/*` and will be treated as an API endpoint. They are server-side only bundles and won't increase your client-side bundle size.

You can export any uppercase [request method](https://en.wikipedia.org/wiki/HTTP#Request_methods): `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, etc.

For example, the following API `GET` endpoint returns a JSON response with a status code of `200`:

```ts filename="src/api/hello.ts" switcher
import { type RequestContext } from "brisa";

export function GET(request: RequestContext) {
  const responseData = JSON.stringify({
    message: "Hello world from Brisa!",
  });

  const responseOptions = {
    headers: { "content-type": "application/json" },
  };

  return new Response(responseData, responseOptions);
}
```

## Query and parameters

If we want for example to use a dynamic route for users and know which username it is:

- `/api/user/aralroca?id=3` → `src/api/user/[username].ts`

We have access to the route through the `RequestContext` and we can access both the parameters and the query.

```ts filename="src/api/user/[username].ts" switcher
import { type RequestContext } from "brisa";

export function GET({ route: { query, params } }: RequestContext) {
  const { id } = params;
  return new Response(`Hello world ${query.username} with id=${id}!`);
}
```

## Request params

The request that arrives is an extension of the native [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request), where apart from having everything that the request has, it has extra information of the request, such as the `i18n`, the `route` and more. If you want to know more take a look at [`request context`](/docs/building-your-application/data-fetching/request-context).

## Request Body

You can read the `Request` body using the standard Web API methods:

```ts filename="src/api/items/route.ts" switcher
export async function POST(request: RequestContext) {
  const res = await request.json();
  return new Response(JSON.stringify({ res }));
}
```

```js filename="src/api/items/route.js" switcher
export async function POST(request) {
  const res = await request.json();
  return new Response(JSON.stringify({ res }));
}
```

## Request Body FormData

You can read the `FormData` using the standard Web API methods:

```ts filename="src/api/items/route.ts" switcher
export async function POST(request: RequestContext) {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  return new Response(JSON.stringify({ name, email }));
}
```

```js filename="src/api/items/route.js" switcher
export async function POST(request) {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  return new Response(JSON.stringify({ name, email }));
}
```

Since `formData` data are all strings, you may want to use [`zod-form-data`](https://www.npmjs.com/zod-form-data) to validate the request and retrieve data in the format you prefer (e.g. `number`).

## Response

The [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) is the native one, so you can find out [here](https://developer.mozilla.org/en-US/docs/Web/API/Response) how it works.

## Consume i18n translations in your API

Like pages, through the request context you can consume translations depending on the locale.

Example:

- `/es/api/user/aralroca?id=3` → `src/api/user/[username].ts`

```ts filename="src/api/user/[username].ts" switcher
import { type RequestContext } from "brisa";

export function GET({ i18n, route: { query, params } }: RequestContext) {
  const { id } = params;
  return new Response(i18n.t("hello", { name: params.username, id }));
}
```

And this inside `src/i18n/index.ts` or `src/i18n.ts` file:

```ts filename="src/i18n/index.ts" switcher
export default {
  locales: ["en", "es"],
  defaultLocale: "en",
  messages: {
    en: {
      hello: "Hello {{name}} with id={{id}}!",
    },
    es: {
      hello: "¡Hola {{name}} con id={{id}}!",
    },
  },
};
```

## Dynamic routes, catch all and optional catch all routes

API Routes support [dynamic routes](/docs/building-your-application/routing/dynamic-routes), and follow the same file naming rules used for `pages/`.

- `/api/post/a?id=3` → `src/api/user/[slug].ts`

It can be extended to catch all paths by adding three dots (`...`) inside the brackets. For example:

- `/api/post/a` → `pages/api/post/[...slug].js`
- `/api/post/a/b` → `pages/api/post/[...slug].js`
  `/api/post/a/b/c` and so on. → `pages/api/post/[...slug].js`

Catch all routes can be made optional by including the parameter in double brackets (`[[...slug]]`).

- `/api/post` → `pages/api/post/[[...slug]].js`
- `/api/post/a` → `pages/api/post/[[...slug]].js`
- `/api/post/a/b`, and so on. → `pages/api/post/[[...slug]].js`

> [!TIP]
>
> **Good to know**: You can use names other than `slug`, such as: `[[...param]]`

## CORS

You can set CORS headers on a `Response` using the standard Web API methods:

```ts
import { type RequestContext } from "brisa";

export async function GET(request: RequestContext) {
  return new Response("Hello, Brisa!", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

## Redirects to a specified path or URL

Taking a form as an example, you may want to redirect your client to a specified path or URL once they have submitted the form.

The following example redirects the client to the `/` path if the form is successfully submitted:

```ts filename="/api/hello.ts" switcher
import { type RequestContext } from "brisa";

export async function POST(req: RequestContext) {
  const { name, message }  = await req.json()

  try {
    await handleFormInputAsync({ name, message })
    return new Response("", {
      status: 307,
      headers: {
        Location: "/",
      },
    })
  } catch (err) {
    return new Response("Failed to fetch data", { status: 500 })
  }
```

## Cache-Control

You can add the `Cache-Control` headers to the response. By default is not using any cache.

```ts filename="app/items/route.ts" switcher
export async function GET() {
  const data = await getSomeData();
  const res = new Response(JSON.stringify(data));

  res.headers.set("Cache-Control", "max-age=86400");

  return res;
}
```

## Headers and Cookies

You can read headers and cookies from the [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) and write headers and cookies to the [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) using Web APIs.

Example reading/writing cookies:

```ts filename="api/route.ts" switcher
import { type RequestContext } from "brisa";

export async function GET(request: RequestContext) {
  const cookies = request.headers.get("cookie");
  const res = new Response("Hello, Brisa!");

  if (cookies) {
    res.headers.set("set-cookie", cookies);
  }

  return res;
}
```

## Streaming

You can use the Web APIs to create a [stream](https://bun.sh/docs/api/streams) and then return it inside the `Response`:

```ts
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue("Hello");
      controller.enqueue(" ");
      controller.enqueue("Brisa!");
      controller.close();
    },
  });

  return new Response(stream); // Hello Brisa!
}
```

## Edge API Routes

TODO
