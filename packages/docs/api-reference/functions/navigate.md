---
description: inject HTML string into the DOM
---

# navigate

## Reference

### `navigate(route: string): Never`

The `navigate` function is used for imperative navigation.

```ts
import { navigate } from "brisa";

// ...
navigate("/some-page");
```

The `navigate` function can be used both on the client and on the server. Although there are some differences to be taken into account:

- If the navigation is done **before** sending the **response** (in the [middleware](/building-your-application/routing/middleware), [`responseHeaders`](/building-your-application/routing/pages-and-layouts#response-headers-in-layouts-and-pages) or an [API endpoint](/building-your-application/routing/api-routes) for example), instead of modifying the navigation history it does a [**301 redirect**](https://en.wikipedia.org/wiki/HTTP_301).
- If it is done **during rendering**, a [**soft redirect**](https://en.wikipedia.org/wiki/Wikipedia:Soft_redirect) is made.
- If used inside a **client-event** or a **server-event** ([action](/building-your-application/data-fetching/server-actions)) a new page is always generated in the **navigation history**.

> [!NOTE]
>
> All [i18n](#i18n-navigation) navigaton rules apply equally in this function.

#### Parameters:

- `route`: The `string` with the page route name. Ex: `/about-us`
- `options`: The `object` with the navigation options. Ex: `{ renderMode: 'transition' }`
  - `renderMode`: The `string` with the render mode. Supported: `'transition'`, `'reactivity'`, `'native'`. (default: `'reactivity'` when the render mode is applicable, otherwise `'native'`)

> [!IMPORTANT]
>
> The usage of `renderMode` is not applicable in the cases that use a hard redirect. Only is applicable in the cases that use a server soft redirect or execute a client-side navigation. Otherwise, always the native render mode is used.

#### Returns:

- `Never` does not require you to use `return navigate('/some')` due to using the TypeScript [`never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) type.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ✅      |
| Web Component     | ✅      |
| SSR Web Component | ✅      |
| Actions           | ✅      |
| Middleware        | ✅      |
| Response headers  | ✅      |
