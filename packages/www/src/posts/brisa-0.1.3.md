---
title: "Brisa 0.1.3"
created: 10/25/2024
description: "Brisa release notes for version 0.1.3"
author: Aral Roca
author_site: https://x.com/aralroca
---

This release fixes 7 bugs. It also includes some improvements and new features, thanks to all contibutors:

- [@mobley-trent](https://github.com/mobley-trent)
- [@enzonotario](https://github.com/enzonotario)
- [@aralroca](https://github.com/aralroca)

## Rename `renderInitiator` to `initiator` and add new features

**Breaking change**:

In this version, we have changed the name of `renderInitiator` to [`initiator`](https://brisa.build/api-reference/components/request-context#initiator). The reason is that it now goes beyond just rendering; it is the initiator of the request, which also tells you if it is an API route—useful in middleware.

```tsx
import { Initiator } from "brisa/server";

export default function ServerComponent(props, req) {
  if (req.initiator === Initiator.INITIAL_REQUEST) {
    req.store.set("count", 0);
  }

  return <div>{req.store.get("count")}</div>;
}
```

## Add `getServer` server API

In this version, we have added the [`getServer`](https://brisa.build/api-reference/server-apis/getServer) server API. The `getServer` function is used to get the server instance of Brisa. It is useful to access the server instance in the server components.

```tsx
import { getServer } from "brisa/server";

// ...
const server = getServer();
/* 
{
  address: {
    address: "::",
    family: "IPv6",
    port: 63621,
  },
  development: true,
  fetch: [Function: fetch],
  hostname: "localhost",
  id: "",
  pendingRequests: 3,
  pendingWebSockets: 1,
  port: 63621,
  protocol: "http",
  publish: [Function: publish],
  ref: [Function: ref],
  reload: [Function: reload],
  requestIP: [Function: requestIP],
  stop: [Function: stop],
  subscriberCount: [Function: subscriberCount],
  timeout: [Function: timeout],
  unref: [Function: unref],
  upgrade: [Function: upgrade],
  url: URL {
    href: "http://localhost:63621/",
    origin: "http://localhost:63621",
    protocol: "http:",
    username: "",
    password: "",
    host: "localhost:63621",
    hostname: "localhost",
    port: "63621",
    pathname: "/",
    hash: "",
    search: "",
    searchParams: URLSearchParams {},
    toJSON: [Function: toJSON],
    toString: [Function: toString],
  },
  [Symbol(Symbol.dispose)]: [Function: dispose],
}
*/
```

## Add support to rewrite routes from the middleware

In this version, we have added support to rewrite routes from the middleware. You can now modify the [`request.finalURL`](https://brisa.build/building-your-application/routing/middleware#rewrite) to change the route before it is processed by Brisa server. In this way, they can be processed from the Brisa RPC client, preserving the store and with a reactive update.

```ts
// src/middleware.ts
export default async function middleware(request) {
  if (request.url.pathname === "/old") {
    // Rewrite: /old -> /new
    request.finalURL = new URL("/new", request.finalURL).toString();
    // Continue processing the request
    return;
  }

  // ... Manage other routes
}
```

## Improve Brisa middleware redirects

During the SPA and Server Actions, you can also return redirects from the middleware. We have improved the way Brisa handles these redirects, transforming hard redirects into soft redirects when they come from the SPA.

## Add example with Elysia.js

In this version, we have added an example with [Elysia.js](https://github.com/brisa-build/brisa/tree/canary/examples/with-elysia). Elysia.js is a JavaScript library that allows you to manage API routes with an ergonomic and declarative API.

```ts
// src/api/[[...slugs]].ts
import { Elysia, t } from "elysia";

const app = new Elysia({ prefix: "/api" })
  .get("/hello", () => "Brisa from Elysia entrypoint")
  .post("/", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  });

export const GET = app.handle;
export const POST = app.handle;
```

## Fix Bun 1.1.33 breaking changes

In this version, we have fixed the breaking changes in Bun 1.1.33 regarding the JSX build AST definition. Now, Brisa is compatible with the latest Bun version, also including backward compatibility with the previous versions.

## What's Changed

- chore(www): fix og images replacing svg to png by [@aralroca](https://github.com/aralroca) in [#568](https://github.com/brisa-build/brisa/pull/568)
- feat(blog): add post about server actions by [@aralroca](https://github.com/aralroca) in [#569](https://github.com/brisa-build/brisa/pull/569)
- feat: add example with elysia.js by [@aralroca](https://github.com/aralroca) in [#573](https://github.com/brisa-build/brisa/pull/573)
- fix(rpc): Prevent full reload when navigating to the same page by [@mobley-trent](https://github.com/mobley-trent) in [#571](https://github.com/brisa-build/brisa/pull/571)
- fix: fix native renderMode on same page by [@aralroca](https://github.com/aralroca) in [#575](https://github.com/brisa-build/brisa/pull/575)
- feat: add `getServer` server API by [@aralroca](https://github.com/aralroca) in [#579](https://github.com/brisa-build/brisa/pull/579)
- fix: improve API detection to allow API root entrypoint by [@aralroca](https://github.com/aralroca) in [#580](https://github.com/brisa-build/brisa/pull/580)
- chore(packages): set npm/yarn/pnpm versions by [@enzonotario](https://github.com/enzonotario) in [#570](https://github.com/brisa-build/brisa/pull/570)
- fix(build): fix Bun 1.1.33 breaking changes by [@aralroca](https://github.com/aralroca) in [#582](https://github.com/brisa-build/brisa/pull/582)
- fix(build): fix server actions in new Bun version by [@aralroca](https://github.com/aralroca) in [#583](https://github.com/brisa-build/brisa/pull/583)
- feat: rename `renderIndicator` to `indicator` and add new features by [@aralroca](https://github.com/aralroca) in [#585](https://github.com/brisa-build/brisa/pull/585)
- docs: add redirect & rewrite documentation by [@aralroca](https://github.com/aralroca) in [#586](https://github.com/brisa-build/brisa/pull/586)
- fix: transform hard to soft redirect when it comes from SPA by [@aralroca](https://github.com/aralroca) in [#587](https://github.com/brisa-build/brisa/pull/587)
- docs: improve navigate docs by [@aralroca](https://github.com/aralroca) in [#589](https://github.com/brisa-build/brisa/pull/589)

## New Contributors

- [@mobley-trent](https://github.com/mobley-trent) made their first contribution in [#571](https://github.com/brisa-build/brisa/pull/571)

**Full Changelog**: [https://github.com/brisa-build/brisa/compare/0.1.2...0.1.3](https://github.com/brisa-build/brisa/compare/0.1.2...0.1.3)
