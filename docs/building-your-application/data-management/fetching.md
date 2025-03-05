---
nav_title: Fetching
description: Learn how to fetch data in your Brisa application.
---

# Data Fetching

Data fetching is a fundamental aspect of any application, influencing its performance and user experience. This documentation outlines how data fetching can be accomplished in a Brisa application, emphasizing best practices and efficient strategies.

## Fetching external data with `fetch`

Brisa recommend to use the native [`fetch` Web API](https://developer.mozilla.org/docs/Web/API/Fetch_API) to get **external data**.

We **don't** make any modifications to the native implementation to handle caching, revalidation, or anything magical, the `fetch` works as `fetch`, because it is the native one. We believe that adding cache and extending the native fetch is a sign of an incorrect design of how to fetch data. So to fix this we have improved the way to share this data in your application.

As all components (server/web) can be `async/await` and are rendered only once, you can do this without problems:

```tsx
export default async function ServerComponent() {
  const res = await fetch(/* */);

  // Your server component logic
}
```

or

```tsx
export default async function WebComponent() {
  const res = await fetch(/* */);

  // Your web component logic
}
```

In the same way, you can fetch data in the [`middleware`](/building-your-application/routing/middleware), [`layout`](/building-your-application/routing/pages-and-layouts#layout), [`responseHeaders`](/building-your-application/routing/pages-and-layouts#response-headers-in-layouts-and-pages), [`Head`](/building-your-application/routing/pages-and-layouts#head), [`suspense` phase](/building-your-application/routing/suspense-and-streaming), etc, and share the data with the rest of the application.

## Fetching internal data

Unlike external data, **internal data** is readily available within your server environment, eliminating the need for `fetch` calls. In Brisa, you can directly access your database or any internal data source from a **server component** and then pass it as a prop to a **web component** or transfer it via the `store` mechanism.

### Direct database access

Since server components are only rendered once, you can safely query your database and return the data without worrying about redundant requests:

```tsx
import { db } from "@/lib/db";

export default async function ServerComponent() {
  const user = await db.getUser();

  return <UserProfile user={user} />;
}
```

### Pass data via props to a web component (Recommended)

The simplest and most efficient way to pass internal data to a web component is through **props**:

```tsx
export default async function ServerComponent() {
  const user = await db.getUser();

  return <user-profile name={user.name} age={user.age} />;
}
```

On the web component side:

```tsx
export default function UserProfile({ name, age }: { name: string; age: number }) {
  return <div>Hello {name}, you are {age} years old.</div>;
}
```

Passing data via props ensures **better performance** and avoids unnecessary requests to the server.

### Transfer data to web components using store

Another way to transfer this data from the server to the client dynamically is using the `store` and [`transferToClient`](/api-reference/components/request-context#transfertoclient) methods:

```tsx
import { type RequestContext } from "brisa";

export async function ServerComponent({}: Props, { store }: RequestContext) {
  const user = await db.getUser();
  store.set("user", user);
  store.transferToClient(["user"]);

  return <user-profile />;
}
```

On the web component side:

```tsx
export function UserProfile({}: Props, { store }: WebContext) {
  return <div>Hello {store.get("user").name}</div>;
}
```

This allows all web components to have access to it, and update it as a signal with `store.set('user', newUser)`.

## Suspense phase

Each component (server-component and web-component) allows an extension to add a [`suspense` component](/building-your-application/routing/suspense-and-streaming) to it, which is the fallback that will be displayed while the component loads.

```js
SomeComponent.suspense = ({}, { i18n }) => {
  return <div>{i18n.t('loading-message')...}</div>
}
```

Suspense is useful during HTML streaming, while the server loads the data the suspense content is displayed, and once the server loads the data, during streaming the suspense is changed to the real content, all this without the client having to make any request to the server.

## Async generators

async generators are also supported if you want to stream every item in a list for example:

```tsx
async function* List() {
  yield <li>{await foo()}</li>;
  yield <li>{await bar()}</li>;
  yield <li>{await baz()}</li>;
}
```

This can be used as a server component:

```tsx
return <List />;
```

And the HTML is resolved via streaming.

Async generators can make sense if used in conjunction with database queries and streaming the results, example with SQLite:

```tsx
import { Database } from "bun:sqlite";

const db = new Database("db.sqlite");

export default function MovieList() {
  return (
    <ul>
      <MovieItems />
    </ul>
  );
}

// Streaming HTML from SQLite query
async function* MovieItems() {
  for (const movie of db.query("SELECT title, year FROM movies")) {
    yield (
      <li>
        {movie.title} ({movie.year})
      </li>
    );
  }
}
```

## Share server-server data between components

To share data across all parts of the server ([`middleware`](/building-your-application/routing/middleware), [`layout`](/building-your-application/routing/pages-and-layouts#layout), [`responseHeaders`](/building-your-application/routing/pages-and-layouts#response-headers-in-layouts-and-pages), [`Head`](/building-your-application/routing/pages-and-layouts#head), [`suspense` phase](/building-your-application/routing/suspense-and-streaming), etc) there are two ways:

1. Request [`store`](docs/api-reference/components/request-context#store)
2. [Context API](/building-your-application/components-details/context)

Example using store:

```tsx
import { type RequestContext } from "brisa";

type Props = {};

export async function Main({}: Props, request: RequestContext) {
  const res = await fetch(/* */);
  const user = await res.json();

  // Set key-value data to request store
  request.store.set("user", user);

  return <UserInfo />;
}

Main.suspense = ({}: Props, request: RequestContext) => (
  <div>Loading user...</div>
);

export function UserInfo({}: Props, request: RequestContext) {
  const user = request.store.get("user");

  return <div>Hello {user.name}</div>;
}
```

Example using Context API:

```tsx
import { type RequestContext, createStore } from "brisa";

type Props = {};

const UserCtx = createStore();

export async function Main({}: Props, request: RequestContext) {
  const res = await fetch(/* */);
  const user = await res.json();

  // Use serverOnly inside context-provider to avoid to create a web
  // component for the provider and share the data only with the
  // server part
  return (
    <context-provider serverOnly context={UserCtx} value={user}>
      <UserInfo />
    </context-provider>
  );
}

Main.suspense = ({}: Props, request: RequestContext) => (
  <div>Loading user...</div>
);

export function UserInfo({}: Props, request: RequestContext) {
  const user = request.useContext(UserCtx);

  return <div>Hello {user.value.name}</div>;
}
```

We recommend that whenever possible you add the data to the `store` inside the request. And use the Context API only in specific cases where you only want to share this data with a piece of the component tree.

The reason is that the **Context API is more expensive** and if you don't put the [`serverOnly`](/building-your-application/components-details/context#serveronly-property) attribute it creates a DOM element (`context-provider`) and shares the data with the rest of the web-components that are in the same component tree.

In both cases the data lives within the lifetime of the request, it is not global data, and one of the benefits is that all server-components receive the [`RequestContext`](/api-reference/components/request-context) as a second parameter, and you can access easily to that data.

The `RequestContext` is an extension of the [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request), where apart from the [Request API](https://developer.mozilla.org/en-US/docs/Web/API/Request) you have some [extra things](/api-reference/components/request-context), such as the store.

> [!TIP]
>
> If your data is utilized in multiple locations, and you wish to display the suspense at the lowest-level component while making only one request, we recommend passing down the [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and resolving it in all child components that utilize this data.

## Share web-web data between components

To share data across all web components there are also the same two ways:

1. Web Context [`store`](/api-reference/components/web-context#store)
2. [Context API](/building-your-application/components-details/context)

Example using store:

**src/web-components/main-app.ts**

```tsx
import { type WebContext } from "brisa";

type Props = {};

export default async function MainApp({}: Props, { store }: WebContext) {
  const res = await fetch(/* */);
  const user = await res.json();

  // Set key-value data to request store
  store.set("user", user);

  return <user-info />;
}

MainApp.suspense = ({}: Props, webContext: WebContext) => (
  <div>Loading user...</div>
);
```

**src/web-components/user-info.ts**

```tsx
export default function UserInfo({}: Props, { store, derived }: WebContext) {
  const username = derived(() => store.get("user").name);

  return <div>Hello {username}</div>;
}
```

Example using Context API:

**src/web-components/main-app.ts**

```tsx
import { type WebContext, createStore } from "brisa";

type Props = {};

const UserCtx = createStore();

export default async function Main({}: Props, request: WebContext) {
  const res = await fetch(/* */);
  const user = await res.json();

  // Use context-provider to share the data with the
  // web part
  return (
    <context-provider context={UserCtx} value={user}>
      <user-info />
    </context-provider>
  );
}

Main.suspense = ({}: Props, webContext: WebContext) => (
  <div>Loading user...</div>
);
```

**src/web-components/user-info.ts**

```tsx
export default function UserInfo({}: Props, { useContext }: WebContext) {
  const user = useContext(UserCtx);

  return <div>Hello {user.value.name}</div>;
}
```

We recommend that whenever possible you add the data to the `store`. And use the Context API only in specific cases where you only want to share this data with a piece of the component tree.

The reason is that the **Context API is more expensive** and it creates a DOM element (`context-provider`).

### Re-fetch data in web components

[Web-components](/building-your-application/components-details/web-components) are reactive, and although they are only rendered once when the component is mounted, an [`effect`](/building-your-application/components-details/web-components#effects-effect-method) can be used to do a `re-fetch` whenever a signal (prop, state, store, context...) changes.

```tsx
export default async function WebComponent(
  { foo }: Props,
  { store, store }: WebContext,
) {
  await effect(async () => {
    if (foo === "bar") {
      const res = await fetch(/* */);
      const user = await res.json();
      // Set key-value data to request store
      store.set("user", user);
    }
  });

  return <user-info />;
}
```

An `effect` can be `async/await` without any problems.

In this example, every time the `foo` prop signal inside the `effect` changes, the effect will be executed again. When updating the store, all web-components that reactively consumed this store entry will be updated with the new data.

## Share server-web data between components

To share data across all parts of the server and web there are two ways:

1. Request [`store`](docs/api-reference/components/request-context#store) using [`transferToClient`](docs/api-reference/components/request-context#transfertoclient) method
2. [Context API](/building-your-application/components-details/context) (without [`serverOnly`](/building-your-application/components-details/context#serveronly-property) prop)

Example using store:

**src/components/server-component.tsx**

```tsx
import { type RequestContext } from "brisa";

type Props = {};

export async function ServerComponent({}: Props, { store }: RequestContext) {
  const res = await fetch(/* */);
  const user = await res.json();

  // Set key-value data to request store
  store.set("user", user);
  // Transfer "user" key-value to WebContext store
  store.transferToClient(["user"]);

  return <user-info />;
}

Main.suspense = ({}: Props, request: RequestContext) => (
  <div>Loading user...</div>
);
```

**src/web-components/user-info.tsx**

```tsx
import { type WebContext } from "brisa";

export function UserInfo({}: Props, { store }: WebContext) {
  // Consuming "user" store value in a web-component:
  return <div>Hello {store.get("user").name}</div>;
}
```

By default the [RequestContext](/api-reference/components/request-context) [`store`](/api-reference/components/request-context#store) is for sharing data only during the lifetime of the request and therefore only with **server** components. However, the `store` has the [`transferToClient`](docs/api-reference/components/request-context#transfertoclient) method to transmit **keys** from the dictionary to the [WebContext](/api-reference/components/web-context) [`store`](/api-reference/components/web-context#store).

Example using Context API:

**src/context/user.ts**

```ts
import { createStore } from "brisa";

export const UserCtx = createStore();
```

**src/components/server-component.tsx**

```tsx
import { type RequestContext } from "brisa";
import { UserCtx } from "@/context/user";

type Props = {};

export async function Main({}: Props, request: RequestContext) {
  const res = await fetch(/* */);
  const user = await res.json();

  // Use context-provider to share the data with the
  // rest of server tree and also the web tree
  return (
    <context-provider context={UserCtx} value={user}>
      <user-info />
    </context-provider>
  );
}

Main.suspense = ({}: Props, request: RequestContext) => (
  <div>Loading user...</div>
);
```

**src/web-components/user-info.tsx**

```tsx
import { type WebContext } from "brisa";
import { UserCtx } from "@/context/user";

export function UserInfo({}: Props, { useContext }: WebContext) {
  const user = useContext(UserCtx);

  return <div>Hello {user.value.name}</div>;
}
```

The Context API by default shares server-web data unless we pass the `serverOnly` attribute to make it server-server only.

> [!CAUTION]
>
> All data transferred between server-web must be [serializable](https://developer.mozilla.org/en-US/docs/Glossary/Serialization).

> [!NOTE]
>
> You can [encrypt store data](/building-your-application/data-management/server-actions#transfer-sensitive-data) if you want to transfer sensitive data to the server actions so that it cannot be accessed from the client.
