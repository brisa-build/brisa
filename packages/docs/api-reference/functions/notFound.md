---
description: allows you to render the [`404 page`](#404-page)
---

# notFound

## Reference

### `notFound(): Never`

The `notFound` function allows you to render the [`404 page`](#404-page) within a route segment as well as inject a `<meta name="robots" content="noindex" />` tag.

Invoking the `notFound()` function throws a `NotFoundError` error and terminates rendering of the route segment in which it was thrown.

```jsx filename="src/pages/user/[id].tsx"
import type { RequestContext } from "brisa";
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
- **During a [server action](/building-your-application/data-management/server-actions):** (server events captured with actions): as the rendering has already been done and it is a post-render action, the 404 in an action acts similarly as in the middle of the streaming. The same happens if in the action instead of calling `notFound()` directly you do a rerender and the component calls `notFound()`.

#### Parameters:

- `void`. _It does not support parameters._

#### Returns:

- `Never` does not require you to use `return notFound()` due to using the TypeScript [`never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) type.

> [!CAUTION]
>
> Avoid using the `notFound` inside a `try/catch` block. The `navigate` is a throwable function and will break the execution of the current function.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ✅      |
| Web Component     | ✅      |
| SSR Web Component | ✅      |
| Actions           | ✅      |
| Middleware        | ✅      |
| Response headers  | ✅      |
