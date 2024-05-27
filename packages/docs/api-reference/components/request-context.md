# Request Context

The `RequestContext` is a set of utilities provided by Brisa to facilitate the development of server components. It is a `Request` with some extra functionalities such as managing store, handling context, i18n, and more.

```tsx
import type { RequestContext } from "brisa";

export default function ServerComponent(props, requestContext: RequestContext) {
  const {
    // Shared data across server/web components
    store,
    useContext,

    // Useful to control pending state in server components
    indicate,

    // Data of the current route
    route,

    // Consume translations and control internationalization
    i18n,

    // Access to websockets
    ws,

    // Get the user IP
    getIp,

    // The `finalURL` is the path of your page file
    finalURL,

    // Request id
    id,

    // The initiator of the render ("SERVER_ACTION", "SPA_NAVIGATION", "INITIAL_REQUEST")
    renderInitiator,

    // Add styles
    css,
  } = requestContext;
  // ... Server component implementation ...
}
```

Being an extension of the [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request), you also have access to all fields of the Request.

In contrast to other frameworks that necessitate imports, our methodology incorporates all these properties directly within each server component.

## `store`

The `store` property is an extended map where values can be stored and shared among all web components. It serves as a global state accessible by all components. Values can be set and retrieved using the `store.set` and `store.get` methods.

Example setting a value:

```ts
store.set("count", 0);
```

Example getting a value:

```tsx
<div>{store.get("count")}</div>
```

> [!NOTE]
>
> The server `store` only lives at request time so that any server component can access the store unless you use [`transferToClient`](#transfertoclient), which extends the life of the store.

### `transferToClient`

The `store` data from request context is only available on the server. So you can store sensitive data without worrying. However, you can transfer certain data to the client side (web-components) using `store.transferToClient` method.

```tsx
import { type RequestContext } from "brisa";

export default async function SomeComponent({}, request: RequestContext) {
  const data = await getData(request);

  request.store.set("data", data);

  // Transfer "data" from store to client
  request.store.transferToClient(["data"]);

  // ..
}
```

This allows access to these values from the web component store.

This setup also enables subsequent [server actions](/building-your-application/data-fetching/server-actions) to access the same `store`, as the communication flows through the client:

`server render` → `client` → `server action` → `client`

It is a way to modify in a reactive way from a server action the web components that consume this `store`.

> [!NOTE]
>
> You can [encrypt store data](/building-your-application/data-fetching/server-actions#transfer-sensitive-data) if you want to transfer sensitive data to the server actions so that it cannot be accessed from the client.

## `useContext`

`useContext: <T>(context: BrisaContext<T>) => { value: T }`

The `useContext` method is used to consume a context value. It takes a `BrisaContext` as a parameter and returns a signal containing the context value. The context value is often used for passing data between a provider and multiple consumers within a component tree.

Example:

```tsx
const foo = useContext(context);
return <div>{foo.value}</div>;
```

For more details, refer to the [context](/building-your-application/components-details/context) documentation.

> [!IMPORTANT]
>
> When referring to `useContext`, it is essential to note that this term should not be confused with the broader concept of `RequestContext` mentioned earlier. The `useContext` is a Brisa Hook for consuming context value, that is piece of data that can be shared across multiple Brisa components. The `RequestContext` denotes the overall environment and configuration specific to each server component, offering a unique and more comprehensive control mechanism. Understanding this distinction is crucial for a clear comprehension of our framework's architecture.

## `indicate`

`indicate(actionName: string): IndicatorSignal`

The `indicate` method is used to add it in the `indicator` HTML extended attribute. This `indicator` automatically set the `brisa-request` class while the indicated server action is pending.

```tsx
const pending = indicate('some-server-action-name');
// ...
css`
 span { display: none }
 span.brisa-request { display: inline }
`
// ...
<>
  <button onClick={someAction} indicateClick={pending}>
    Run some action
  </button>
  <span indicator={pending}>Pending...</span>
</>
```

### Parameters:

- `string` - Indicator name. It can refer to the server action. The idea is that you can use the same indicator in other components (both server and web) using the same name to relate it to the same server action.

For more details, take a look to:

- [`indicate`](/api-reference/components/web-context#indicate) in web components, similar method but from [`WebContext`](/api-reference/components/web-context).
- [`indicate[Event]`](/api-reference/extended-html-attributes/indicateEvent) HTML extended attribute to use it in server components to register the server action indicator.
- [`indicator`](/api-reference/extended-html-attributes/indicator) HTML extended attribute to use it in any element of server/web components.

## `route`

The route is the matched route of the request.

You can access to:

- `params` - for dynamic routes like `/[user]` you can access to `params.user`.
- `filePath` - path of your page file.
- `pathname` - path portion of the URL.
- `query` - A record of query parameters extracted from the URL.
- `name` - The name associated with the route.
- `kind`- The type of route: `exact`, `catch-all`, `optional-catch-all`, or `dynamic`.
- `src`- The source string representing the route.

Example of object:

```js
{
  filePath: "/Users/aralroca/Documents/brisa/fun/pages/blog/[slug].tsx",
  kind: "dynamic",
  name: "/blog/[slug]",
  pathname: "/blog/my-cool-post",
  src: "/blog/[slug].js",
  params: {
    slug: "my-cool-post"
  }
}
```

Example consuming:

```tsx
<div>{route.pathname}</div>
```

## `i18n`

`i18n: I18n`

The `i18n` object provides utilities for accessing the locale and consuming translations within components.

Example:

```tsx
const { t, locale } = i18n;
return <div>{t("hello-world")}</div>;
```

For more details, refer to the [i18n](/building-your-application/routing/internationalization) documentation.

## `ws`

In case you have [configured WebSockets](/building-your-application/routing/websockets.md), you can access them from any server component, api route, middleware, etc. The `ws` is of type `ServerWebSocket`, where is:

```ts
interface ServerWebSocket {
  readonly data: any;
  readonly readyState: number;
  readonly remoteAddress: string;
  send(message: string | ArrayBuffer | Uint8Array, compress?: boolean): number;
  close(code?: number, reason?: string): void;
  subscribe(topic: string): void;
  unsubscribe(topic: string): void;
  publish(topic: string, message: string | ArrayBuffer | Uint8Array): void;
  isSubscribed(topic: string): boolean;
  cork(cb: (ws: ServerWebSocket) => void): void;
}
```

Example:

```ts
import { type RequestContext } from "brisa";

export function GET({ ws, i18n }: RequestContext) {
  const message = i18n.t("hello-world");

  // Sending a WebSocket message from an API route
  ws.send(message);

  return new Response(message, {
    headers: { "content-type": "text/plain" },
  });
}
```

> [!NOTE]
>
> For more information see [Bun's WebSockets documentation](https://bun.sh/docs/api/websockets#sending-messages).

## `getIP`

The IP address of a given Request can be retrieved via `getIP`.

Below it calls Bun's [`server.requestIP`](https://bun.sh/blog/bun-v1.0.4#implement-server-requestip).

## `finalURL`

The `finalURL` is the URL of your page, regardless of the fact that for the users it is another one.

Example, an user enter to:

- `/es/sobre-nosotros/`

But the `finalURL` is:

- `/about-us`

Because your page is in `src/pages/about-us/index.tsx`

## `id`

The `id` is the unique identifier of the request. This id is used internally by Brisa, but we expose it to you because it can be useful for tracking.

Example:

```ts
console.log(id); // 1edfa3c2-e101-40e3-af57-8890795dacd4
```

## `renderInitiator`

The `renderInitiator` is a string that represents the initiator of the render. It can be:

- `RequestInitiator.SERVER_ACTION` - When is the rerender by a server action.
- `RequestInitiator.SPA_NAVIGATION` - When the render is initiated by a SPA navigation.
- `RequestInitiator.INITIAL_REQUEST` - When the render is initiated by the initial request.

The default value is `RequestInitiator.INITIAL_REQUEST`.

> [!NOTE]
>
> This is useful to know how the render was initiated and to make decisions based on it, for example initializing the [store](#store) only in the `RequestInitiator.INITIAL_REQUEST`. For API routes, the `renderInitiator` is always `RequestInitiator.INITIAL_REQUEST`.

## `css`

`css(strings: TemplateStringsArray, ...values: string[]): void`

The `css` template literal is used to inject CSS into the DOM. It allows developers to define styles directly within server components using a template literal.

Unlike web components, this `css` template literal in server components does not encapsulate. This code would affect all `div`s on the page:

Example:

```ts
css`
  div {
    background-color: ${color};
  }
`;
```

> [!TIP]
>
> We recommend using the `css` template literal for specific cases such as generating CSS animations based on dynamic JavaScript variables.

For more details, refer to the [Template literal `css`](/building-your-application/components-details/web-components#template-literal-css) documentation.
