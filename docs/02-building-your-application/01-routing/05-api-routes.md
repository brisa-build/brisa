---
title: API Routes
description: Brisa supports API Routes, which allow you to build your API without leaving your Brisa app. Learn how it works here.
---

API routes provide a solution to build a **public API** with Brisa.

Any file inside the folder `src/api` is mapped to `/api/*` and will be treated as an API endpoint. They are server-side only bundles and won't increase your client-side bundle size.

You can export any lowercase [request method](https://en.wikipedia.org/wiki/HTTP#Request_methods): `get`, `post`, `patch`, `put`, `delete`, etc.

For example, the following API `get` endpoint returns a JSON response with a status code of `200`:

```ts filename="src/api/hello.ts" switcher
import { type RequestContext } from "brisa";

export function get(request: RequestContext) {
  const responseData = JSON.stringify({
    message: "Hello world from Brisa!"
  })

  const responseOptions = {
    headers: { "content-type": "application/json" }
  }

  return new Response(responseData, responseOptions);
}
```


## Query and parameters

If we want for example to use a dynamic route for users and know which username it is:
- `/api/user/aralroca?id=3` → `src/api/user/[username].ts`

We have access to the route through the `RequestContext` and we can access both the parameters and the query.

```ts filename="src/api/user/[username].ts" switcher
import { type RequestContext } from "brisa";

export function get({ route: { query, params } }: RequestContext) {
  const { id } = params
  return new Response(`Hello world ${query.username} with id=${id}!`);
}
```

## Request param

The request that arrives is an extension of the native [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request), where apart from having everything that the request has, it has extra information of the request, such as the `i18n`, the `route` and more. If you want to know more take a look at [`request context`](/docs/building-your-application/data-fetching/request-context).


## Response

The [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) is the native one, so you can find out [here](https://developer.mozilla.org/en-US/docs/Web/API/Response) how it works.

## Consume i18n translations in your API

Like pages, through the request context you can consume translations depending on the locale.

Example:

- `/es/api/user/aralroca?id=3` → `src/api/user/[username].ts`

```ts filename="src/api/user/[username].ts" switcher
import { type RequestContext } from "brisa";

export function get({ i18n, route: { query, params } }: RequestContext) {
  const { id } = params
  return new Response(i18n.t('hello', { name: params.username, id }));
}
```

And this inside `src/i18n/index.ts` or `src/i18n.ts` file:


```ts filename="src/i18n/index.ts" switcher
export default {
  locales: ['en', 'es'],
  defaultLocale: 'en',
  messages: {
    en: {
      hello: 'Hello {{name}} with id={{id}}!',
    },
    es: {
      hello: '¡Hola {{name}} con id={{id}}!',
    },
  },
}
```

## Dynamic routes, catch all and optional catch all routes

API Routes support [dynamic routes](/docs/building-your-application/routing/dynamic-routes), and follow the same file naming rules used for `pages/`.

- `/api/post/a?id=3` → `src/api/user/[slug].ts`

It can be extended to catch all paths by adding three dots (`...`) inside the brackets. For example:

- `/api/post/a` → `pages/api/post/[...slug].js`
- `/api/post/a/b`  → `pages/api/post/[...slug].js`
 `/api/post/a/b/c` and so on.  → `pages/api/post/[...slug].js`

Catch all routes can be made optional by including the parameter in double brackets (`[[...slug]]`).

- `/api/post` → `pages/api/post/[[...slug]].js` 
- `/api/post/a` → `pages/api/post/[[...slug]].js` 
- `/api/post/a/b`, and so on. → `pages/api/post/[[...slug]].js` 


> **Good to know**: You can use names other than `slug`, such as: `[[...param]]`

## CORS

You can set CORS headers on a `Response` using the standard Web API methods:

```ts
export async function get(request: Request) {
  return new Response('Hello, Brisa!', {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

## Streaming

TODO

## Edge API Routes

TODO
