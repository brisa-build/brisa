---
description: Understand how to use signals and reactivity in Brisa.
---

# Reactivity

The reactivity in Brisa is based on signals. The signals are the state, the props, the store, the derived and the context. The signals are reactive, that is, when they change, they automatically update the parts of the DOM where they are used.

In order to don't break the reactivity, you have to use the `.value` clause when you want to consume the signal. For example:

```tsx
export default function Counter({}, { state }: WebContext) {
  const count = state<number>(0);

  return (
    <>
      <button onClick={() => count.value++}>+</button>
      <span> Counter: {count.value} </span>
      <button onClick={() => count.value--}>-</button>
    </>
  );
}
```

It is important to know that using `.value` outside the return of the component will break the reactivity. For example:

```tsx
export default function Counter({}, { state }: WebContext) {
  const count = state<number>(0);

  // ❌ variable is no longer reactive
  const currentCount = count.value;

  return (
    <>
      <button onClick={() => count.value++}>+</button>
      <span> Counter: {currentCount} </span>
      <button onClick={() => count.value--}>-</button>
    </>
  );
}
```

However, thanks to compilation-time optimizations, we allow the use of early returns in Brisa without breaking reactivity:

```tsx
export default function Counter({}, { state }: WebContext) {
  const count = state<number>(0);

  // ✅ variable is still reactive
  if (count.value === 0) {
    return <div>Counter is zero</div>;
  }

  return (
    <>
      <button onClick={() => count.value++}>+</button>
      <span> Counter: {count.value} </span>
      <button onClick={() => count.value--}>-</button>
    </>
  );
}
```

## Are signals readonly?

Only the props signals are readonly, otherwise are writable. However, you can't mutate them directly. You have to use the `.value` clause to mutate them setting a new value. For example:

```tsx
count.value = 10; // ✅
count = 10; // ❌

user.value = { username: "Aral" }; // ✅
user = { username: "Aral" }; // ❌
user.value.username = "Aral"; // ❌
```

> [!TIP]
>
> To update the value of a signal, you need to provoke a setter to the `value` property. For example: `user.value = { username: 'Aral' };`. If you try to update the inner properties of the signal directly, the reactivity will not work, because doing `user.value.username = 'Aral'` will trigger a getter (`user.value.username`) and not a setter.

## Are props reactive?

Props are an special kind of signals optimized in compilation-time. You don't need to use the `.value` clause to consume them. They are readonly. So, this means that you can't mutate them.

This also allows to define a default value for a prop in a easy way:

```tsx
export default function Counter({ initialValue = 0 }, { state }: WebContext) {
  const count = state<number>(initialValue);

  return (
    <>
      <button onClick={() => count.value++}>+</button>
      <span> Counter: {count.value} </span>
      <button onClick={() => count.value--}>-</button>
    </>
  );
}
```

In Brisa we are doing optimizations in build-time to allow you to declare props inside the component arguments without losing reactivity. For example `username` and `displayName` are reactive in the following component:

```tsx
export default function UserCard({
  user: { username, displayName } = { username: "Unknown" },
}) {
  return (
    <>
      <span> Username: {username} </span>
      <span> Display Name: {displayName} </span>
    </>
  );
}
```

An alternative way to do it outside the component arguments is consuming directly the signal inside the JSX:

```tsx
export default function UserCard({ user }) {
  return (
    <>
      <span> Username: {user.username ?? "Unknown"} </span>
      <span> Display Name: {user.displayName} </span>
    </>
  );
}
```

However, this way is not recommended because it breaks the reactivity:

```tsx
export default function Counter({ user }) {
  const { username, displayName } = user;

  return (
    <>
      <span> Username: {username} </span>
      <span> Display Name: {displayName} </span>
    </>
  );
}
```

For derived props, you can use the [`derived`](/api-reference/components/web-context#derived) method:

```tsx
export default function Counter({ user }, { derived }: WebContext) {
  const username = derived(() => user.username.toUpperCase());
  const displayName = derived(() => user.displayName.toUpperCase());

  return (
    <>
      <span> Username: {username.value} </span>
      <span> Display Name: {displayName.value} </span>
    </>
  );
}
```

In the last example, `username` and `displayName` are derived signals from the `user` prop signal to display the username and display name in uppercase.

## Can I create a signal from a signal?

Yes, you can create a signal from a signal using the [`derived`](/building-your-application/components-details/web-components#derived-state-and-props-derived-method) method. This method is useful to create a signal that depends on other signals.

```tsx
export default function DoubleCounter({}, { state, derived }: WebContext) {
  const count = state(0);
  const double = derived(() => count.value * 2);

  return (
    <div>
      <button onClick={() => count.value--}>Decrement</button>
      {double.value}
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}
```

In this example, `double` is a signal that depends on `count`. When `count` changes, `double` will automatically update.

If you want to create a custom signal inside the `WebContext` to re-use it in multiple components, you can use [expand the `WebContext`](/api-reference/components/web-context#expanding-the-webcontext).

## Can I use signals in the server?

No directly. The signals are reactive and they are used in the client-side. However, action-signals concept exists and you can use the server [`store`](/building-your-application/components-details/server-components#store-store-method) method and transfer some store fields to the client-side and reactively update them on a server action.

```tsx
import type { RequestContext } from "brisa";
import { rerenderInAction } from "brisa/server";

export default function ServerComponent({}, { store }: RequestContext) {
  // Setting store
  if (!store.has("user")) {
    store.set("user", { username: "foo", displayName: "Foo" });
  }

  // Extends the life of the store property beyond request-time
  // (Necessary to use it in a server action)
  store.transferToClient(["user"]);

  function updateName() {
    // Update the store inside a server action
    store.set("user", { username: "bar", displayName: "Bar" });
    rerenderInAction({ type: "page" });
  }

  // Consuming store
  return (
    <>
      Hello {store.get("user").displayName}
      <button onClick={updateName}>Update name</button>
    </>
  );
}
```

The natural lifecycle of the server `store` is:

- Middleware
- Rendering (layout, page, components)

But thanks to `store.transferToClient` method, you extend the lifecycle of some `store` fields to:

- Middleware
- Rendering (layout, page, components)
- Client side (as signal)
- Server Actions
- Client side (as signal)
- etc ...

And modifing the value on server actions, is reflected in a reactive way on the client side signals.
