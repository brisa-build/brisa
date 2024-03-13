TODO

## `route`

TODO

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

- [`indicate`](/building-your-application/data-fetching/web-context#indicate) in web components, similar method but from [`WebContext`](/building-your-application/data-fetching/web-context).
- [`indicate[Event]`](/api-reference/extended-html-attributes/indicateEvent) HTML extended attribute to use it in server components to register the server action indicator.
- [`indicator`](/api-reference/extended-html-attributes/indicator) HTML extended attribute to use it in any element of server/web components.
