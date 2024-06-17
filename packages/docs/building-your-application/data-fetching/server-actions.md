---
nav_title: Server Actions
description: Learn how to handle events in the server and form submissions with Brisa.
---

# Server Actions

Server Actions are functions/arrow functions that are executed on the server once the user interacts with the page. They can be used only in Server Components to handle browser events on the server.

## Convention

A Server Action can be defined like a browser event inside the Server Component JSX.

```tsx
<button
  onClick={(e) =>
    console.log(
      "this code is executed on the server in case of Server Components",
      e,
    )
  }
>
  Click to run a server action
</button>
```

While web-components these actions are browser events and are processed from the client, in server components these actions are executed on the server, having access to the serialized event.

> [!TIP]
>
> You can pass server actions as props in the same way of events. At the moment the action is placed in a web component, inside the web component the real event of the browser acts, and outside the web component then it is executed from the server.

## Behavior

- Server Actions are not limited to `<form>` and can be invoked from any element like `<button>`.
- Server Actions are Hypermedia-driven, when an action is invoked, it can respond new HTML and update the UI only by affecting the parts of the DOM that have modified and the web-components can respond reactively to the changes, all in a single round-trip from the server.
- Behind the scenes, actions use the `POST` method, and only this HTTP method can invoke them.
- When an action is invoked the [`preventDefault`](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault) is automatic called.
- Server Actions serialize the event to access it from the server. In the case of `onSubmit`, it process the `formData` to send it to the server, then the event changes from [`SubmitEvent`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) to [`FormDataEvent`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event), so you can access directly to the `e.formData`.
- Server Actions are functions. This means they can be reused anywhere in your application.

> [!CAUTION]
>
> Server actions only work with the `output: "server"` [configuration](/building-your-application/configuring/output) (the default).

## Forms

Brisa transforms the [`SubmitEvent`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) to [`FormDataEvent`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event), so you can access directly to the `e.formData`. This is because Brisa have to build the `formData` before sending it to the server, so on the server it is already built.

```tsx
export default function Form() {
  return (
    <form
      onSubmit={(e) => {
        console.log("Username:", e.formData.get("username"));
      }}
    >
      <label>
        Username:
        <input type="text" name="username" />
      </label>
      <br />
      <button type="submit">Submit</button>
    </form>
  );
}
```

> [!TIP]
>
> When working with forms that have many fields, you may want to consider using the [`entries()`](https://developer.mozilla.org/en-US/docs/Web/API/FormData/entries) method with JavaScript's [`Object.fromEntries()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries). For example: `const rawFormData = Object.fromEntries(formData.entries())`

### Form action without JS

When you use the `onSubmit` action of a `form`, it can **work without JavaScript** automatically. However, if you want a different behavior when the user does not have JavaScript you can override the "`action`", "`enctype`" and "`method`" attributes and connect it to a specific endpoint. Normally it will not be necessary to overwrite them, but we prefer that it is feasible to do so.

The differences to be taken into account when no-JS are:

- No action signals can be used, the properties of the store at this point die on the client.
- The page is reloaded always with the new content, instead of doing the `rerenderInAction`.

<!-- {% twitter 1769418996476940630 %} -->

## Nested actions

In Brisa we allow nested actions to be used. We want the actions in the server components to be as similar as possible to the events in the web components.

```tsx
export function ParentComponent() {
  function onAction() {
    console.log("this works in the server");
  }

  return <ChildComponent onAction={onAction} />;
}

function ChildComponent({ onAction }: { onAction: () => void }) {
  return <button onClick={onAction}>Run the action</button>;
}
```

This way you can divide responsibilities between components if you wish and share data between actions:

```tsx
export function ParentComponent() {
  function onAction(data: string) {
    console.log("server data:", data);
  }

  return <ChildComponent onAction={onAction} />;
}

function ChildComponent({ onAction }: { onAction: () => void }) {
  return (
    <button
      onClick={() => {
        const data = "We can transfer data in nested actions";
        onAction(data);
      }}
    >
      Run the action
    </button>
  );
}
```

> [!IMPORTANT]
>
> Actions and nested actions are always `async`.

The actions, even if you have not written them async, are **always executed async**, if you need to do something after executing a nested action it is necessary to put an `await`:

```tsx
async function onAction() {
  await onNestedAction();
  console.log("Done!");
}
```

## Server-side validation and error handling

We recommend using HTML validation like `required` and `type="email"` for basic client-side form validation.

For more advanced server-side validation, you can use a library like [zod](https://zod.dev/) to validate the form fields before mutating the data, together with [Action Signals (store)](#action-signals).

```tsx
import { rerenderInAction, type RequestContext } from "brisa";
import { z } from "zod";

const schema = z.object({
  email: z.string().email({ message: "Invalid email" }),
});

// Reactive server component without the need to create a client component:
export default function Form({}, { store }: RequestContext) {
  const errors = store.get("errors");

  // You extend the life of the store from request-time:
  //  render (server) → 💀
  // to:
  //  render (server) → client → action (server) → rerender (server) → client → ...
  store.transferToClient(["errors"]);

  return (
    <form
      onSubmit={(e) => {
        const email = e.formData.get("email");
        const result = schema.safeParse({ email });

        store.set("errors", result.success ? null : result.error.format());

        // rerenderInAction is used to make the server components reactively react
        // to the store change as well. If rerenderInAction is not used, only the
        // web components that are listening to the store.get('errors') signal
        // react to the changes.
        rerenderInAction({ type: "page" });
      }}
    >
      <input name="email" type="text" />
      {errors?.email && <p>{errors.email._errors.toString()}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

> [!IMPORTANT]
>
> Before mutating data, you should always ensure a user is also authorized to perform the action. See [Authentication and Authorization](#authentication-and-authorization).

### Action fail handling

If the server action fails, you can access from the web components to the error message through the `error` signal inside the `IndicatorSignal`.

```tsx
import { type WebContext } from "brisa";

type Props = { actionId: string };

export default async function ActionError(
  { actionId }: Props,
  { indicate }: WebContext,
) {
  const actionIndicator = indicate(actionId);

  if (typeof actionIndicator.error.value !== "string") return;

  return <div>Error: {actionIndicator.error.value}</div>;
}
```

In this example, the `action-error` web component takes an `actionId` prop and utilizes the [`indicate`](/api-reference/components/web-context#indicate) method to obtain the indicator signal associated with that specific action. The code then checks whether the `error` value within the `indicator` is a `string`. If it is, the component renders a UI element displaying the error message. This mechanism allows developers to seamlessly incorporate error handling into their web components, enhancing the user experience by providing meaningful error information when server actions encounter issues.

> [!NOTE]
>
> The same `actionId` as the value for the [`indicate[Event]`](/api-reference/extended-html-attributes/indicateEvent) linking the indicator to the corresponding server action. This cohesive association allows developers to seamlessly integrate error handling into their web components, ensuring that meaningful error information is presented to users when server actions encounter issues.

## Debounce

Brisa extends all the HTML element events (`onInput`, `onMouseOver`, `onTouchStart`...) to allow to [debounce](/api-reference/extended-html-attributes/debounceEvent) the action call by replacing the `on` prefix to `debounce`.

```tsx
<input
  type="text"
  onInput={(e) => console.log(e.target.value)}
  debounceInput={400}
/>
```

The time unit consistently remains in milliseconds. In this example, the call to the server and consequently the execution of `console.log` will only take place `400ms` after the user ceases typing in the textbox.

> [!CAUTION]
>
> Only works in the HTML elements that trigger the action, if you use it in the components as a prop it will only work if you use it inside the component to link it with the HTML element that triggers the action. The only exception is to use it in a web-component from a server component, as the web components are transformed into real HTML elements that trigger actions, then in this case it does work.

> [!CAUTION]
>
> This is only implemented for server actions, for browsers events inside web components it does not apply since we do not modify the original event.

## Optimistic updates

Optimistic updates are a strategy used in client-server architectures to enhance the user experience by locally updating the user interface (UI) optimistically before receiving confirmation from the server about the success of an operation. This approach aims to reduce perceived latency and provide a more responsive application.

In Brisa, we support optimistic updates to manage server actions, and this is achieved through the use of the [**`setOptimistic`**](/api-reference/components/web-context#setOptimistic) method within the [`store`](/api-reference/components/web-context#store) of [web components](/building-your-application/components-details/web-components).

Example of web component (`like-button`):

```tsx
import type { WebContext } from "brisa";

type Props = { onLike: () => void };

export default function LikeButton({ onLike }: Props, { store }: WebContext) {
  return (
    <button
      onClick={() => {
        store.setOptimistic<number>("like-action", "likes", (v) => v + 1);
        onLike();
      }}
    >
      Like ({store.get("likes")})
    </button>
  );
}
```

Here, the `like-button` web component employs the `setOptimistic` method to optimistically increment the '`likes`' count on the client side, assuming a successful action. The current '`likes`' count is then displayed in the UI.

Now, let's observe how this `like-button` is utilized in a server component, complete with the associated server action:

```tsx
import type { RequestContext } from 'brisa';
import { getUser, updateDB } from '@/helpers'

function Page({}, request: RequestContext)
  const { store, indicate } = request;
  const indicator = indicate('like-action')

  store.transferToClient(['likes'])

  async function onLikeAction() {
    const user = getUser(request)
    const updatedNum = await updateDB(user)
    // Update shared store with the client:
    store.set('likes', updatedNum)
  }

  return (
    <like-button
      // It's necessary to connect the indicator to the action
      indicateLike={indicator}
      onLike={onLikeAction}
    />
  )
}
```

In the server component, we utilize the [`transferToClient`](/api-reference/components/request-context) method to relay the '`likes`' data to the client-side store. Upon executing the action, the server component interacts with the database, and if successful, it updates the shared store with the new 'likes' count.

> [!IMPORTANT]
>
> It's crucial to note that in the event of a failed request action, the optimistic update is automatically reverted to the previous state, ensuring data consistency.

### Optimistic updates via URL params

If you want to use the optimistic update via URL search params, you can do it in the same way (you need the `store.setOptimistic`), the only difference is that from the server action instead of updating the store value, you can directly use the function navigate and pass it as search param.

Example of web component (`like-button`):

```tsx
import type { WebContext } from "brisa";

type Props = { onLike: () => void };

export default function LikeButton({ onLike }: Props, { store }: WebContext) {
  return (
    <button
      onClick={() => {
        store.setOptimistic<number>("like-action", "likes", (v) => v + 1);
        onLike();
      }}
    >
      Like ({store.get("likes")})
    </button>
  );
}
```

Example of server component:

```tsx
import { navigate, type RequestContext } from "brisa";
import { getUser, updateDB } from "@/helpers";

function Page({}, req: RequestContext) {
  const { store, indicate, route } = req;
  const indicator = indicate("like-action");
  const defaultLikes = route.query.likes ? +route.query.likes : 0;

  // It's needed to communicate with the client
  store.set("likes", defaultLikes);
  store.transferToClient(["likes"]);

  async function onLikeAction() {
    const user = getUser(req);
    const updatedNum = await updateDB(user);
    // Update URL param:
    const url = new URL(req.url);
    url.searchParams.set("likes", store.get("likes") + 1);
    navigate(url.toString());
  }

  return (
    <like-button
      // It's necessary to connect the indicator to the action
      indicateLike={indicator}
      onLike={onLikeAction}
    />
  );
}
```

## `rerenderInAction`

The [`rerenderInAction`](/api-reference/server-apis/rerenderInAction) method is used to rerender the component or the page
inside a server action. Outside of an action, it throws an error.

#### Params:

- `type`: The type of the rerender. It can be `component` or `page`. By default, it is `component`.
- `mode`: The type of the rerender. It can be `reactivity` or `transition`. By default, it is `reactivity`.

`rerenderInAction` needs to be called outside of the `try/catch` block:

```tsx
import { rerenderInAction } from "brisa";

// Inside a server action
function handleEvent() {
  try {
    // ...
  } catch (error) {
    // ...
  }

  // Trigger a full-page rerender
  rerenderInAction({ type: "page" });
}
```

## `navigate`

If you would like to navigate the user to a different route after the completion of a Server Action, you can use [`navigate`](/api-reference/functions/navigate) API. `navigate` needs to be called outside of the `try/catch` block:

```tsx
import { navigate } from "brisa";

export async function createPost(id: string) {
  try {
    // ...
  } catch (error) {
    // ...
  }

  navigate(`/post/${id}`); // Navigate to the new post page
}
```

## Cookies

You can access to the request inside the server action to read cookies from headers, then you can communicate via request store to the [`responseHeaders`](/building-your-application/routing/pages-and-layouts#response-headers-in-layouts-and-pages) of the page:

```tsx
import type { RequestContext } from "brisa";

export default function Login({}, req: RequestContext) {
  return (
    <form
      onSubmit={(e) => {
        const username = e.formData.get("username");
        // Read the cookies
        const cookies = req.headers.get("cookie");
        // Store data inside the request:
        req.store.set("new-cookies", "foo=bar;");
      }}
    >
      {/* ... */}
    </form>
  );
}

export function responseHeaders(req: RequestContext) {
  // Read the stored data:
  const newCookies = req.store.get("new-cookies");

  return {
    "Set-Cookie": newCookies,
  };
}
```

## Security

### Authentication and authorization

You should treat Server Actions as you would public-facing API endpoints, and ensure that the user is authorized to perform the action. For example:

```tsx
import { Database } from "bun:sqlite";
import { rerenderInAction, type RequestContext } from "brisa";
import validateToken from "@/auth/validate-token";

const db = new Database("mydb.sqlite");
const query = db.query("SELECT * FROM cats");
const insert = db.prepare(`INSERT INTO cats (name) VALUES (?)`);

export default function CatsComponent({}, req: RequestContext) {
  const invalidTokenError = req.store.get("invalidTokenError");
  const cats = query.all();

  async function addCat(e: FormDataEvent) {
    const cookies = getCookies(req.headers);
    const token = cookies?.["X-Token"];
    const isTokenValid = await validateToken(token);

    if (!isTokenValid) {
      // handle invalid token
      req.store.set("invalidTokenError", "The token is invalid");
      rerenderInAction({ type: "page" });
    }

    insert.run(e.formData.get("cat") as string);
    rerenderInAction({ type: "page" });
  }

  req.store.transferToClient(["invalidTokenError"]);

  return (
    <form onSubmit={addCat}>
      <input name="cat" type="text" placeholder="Cat Name" />
      <button>Add random cat</button>
      <ul>
        {cats.map((cat) => (
          <li key={cat.id}>{cat.name}</li>
        ))}
      </ul>
      {invalidTokenError && <div>{invalidTokenError}</div>}
    </form>
  );
}

// Example of getCookies (you can also use any library):
function getCookies(headers: Headers): Record<string, string> {
  const cookie = headers.get("Cookie");
  const out: Record<string, string> = {};

  if (cookie === null) return {};

  for (const kv of cookie.split(";")) {
    const [cookieKey, ...cookieVal] = kv.split("=");
    const key = cookieKey.trim();
    out[key] = cookieVal.join("=");
  }

  return out;
}
```

> [!NOTE]
>
> For more information see the [Authentication documentation](/building-your-application/authentication/index).

## Action Signals

From the server you can consume a [`store`](/api-reference/components/request-context#store) that by default has a limited lifetime and only lives on **request-time**. However, **you can expand the lifetime** of some properties of the store with the method: [`transferToClient`](/api-reference/components/request-context#transfertoclient). The moment you do this, not only do you expand its life in client-time, but you can then re-use it in action-time.

Defining a Server Action inside a component creates a [closure](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures) where the action has access to the outer function's scope. For example, the `onClick` action has access to the `foo` variable:

```tsx filename="src/pages/index.tsx"
export default function Page() {
  const foo = "bar";

  function onClick() {
    if (foo === "bar") {
      // ...
    }
  }

  return <button onClick={onClick}>Click</button>;
}
```

However, only static variables can be reused. In Brisa for **security** we don't expose server variables in the client directly to then pass them back to the server action. So, if instead of the string `bar` it would be `Math.random()` it would be a different value in rendering-time than action-time.

> render _(server)_ → HTML _(client)_ → action _(server)_ → HTML _(client)_ ...

For these cases, you can use the [**action signals**](#action-signals) through the `store` method to improve the communication between render and action.

```tsx filename="src/pages/index.tsx"
import type { RequestContext } from "brisa";
import { RenderInitiator } from "brisa/server";

export default function Page(
  {},
  { store, method, renderInitiator }: RequestContext,
) {
  // set communication render-value during the initial request
  // (not in the rerender of the server action or during SPA navigation)
  if (renderInitiator === RenderInitiator.INITIAL_REQUEST) {
    store.set("foo", Math.random());
    store.transferToClient(["foo"]);
  }

  function onClick() {
    // get communication render-value
    const renderFooValue = store.get("foo");
    // ..
    // set communication action-client:
    store.set("foo", Math.random());
  }

  return (
    <button onClick={onClick}>
      {/* display "render" and "action" value */}
      {store.get("foo")}
    </button>
  );
}
```

Only in these cases, these `store` properties will be exposed in the HTML.

> [!TIP]
>
> Changing the value of the action signal within the action will also reflect the change in the rendering and also, reactively, to all web components that consume the same store property. The concept is similar to the `store` of web components.

> [!IMPORTANT]
>
> The values of the action signals (`store`) must be [serializable](https://developer.mozilla.org/en-US/docs/Glossary/Serialization).

> [!CAUTION]
>
> Use unencrypted `transferToClient` only for **NON-SENSITIVE DATA** only. These values are shared through HTML. If you need sensitive data, you must use `transferToClient(['foo'], { encrypt: true });` or use a database.

### Store as action signal

To communicate with the same `store` between server and client you have to use the `transferToClient` option. For security reasons the data of the server `store` are only server data and are not shared in the client `store`. However, for non-sensitive data you can use the `transferToClient` property to share the store throughout your application, communicating any server component with any web component reactively, also accessible inside server actions.

#### Server component

**`src/components/server-counter.tsx`**

```tsx
import type { RequestContext } from "brisa";

export default function ServerCounter({}, { store }: RequestContext) {
  store.set("count", 0); // Initializes the store value on the server

  // Mark "count" as non-sensible data and transfer to the client
  store.transferToClient(["count"]); // This line is necessary

  return (
    <div>
      <button
        onClick={() => {
          store.set("count", store.get("count") + 1);
        }}
      >
        Server +
      </button>
      <web-counter />
      <button
        onClick={() => {
          store.set("count", store.get("count") - 1);
        }}
      >
        Server -
      </button>
    </div>
  );
}
```

#### Web component

**`src/web-components/web-counter.tsx`**

```tsx
import type { WebContext } from "brisa";

export default function WebCounter({}, { store }: WebContext) {
  return (
    <div>
      <button
        onClick={() => {
          store.set("count", store.get("count") + 1);
        }}
      >
        Client +
      </button>
      Count value: {store.get("count")}
      <button
        onClick={() => {
          store.set("count", store.get("count") - 1);
        }}
      >
        Client -
      </button>
    </div>
  );
}
```

This example shows a counter shared between the server and the client. It can be incremented from the action (server component) or from the browser event (web component), and the store value will always be synchronized between the two.

## Transfer sensitive data

If you want to transfer sensitive data from the render to use it later on the action you can use:

```ts
store.transferToClient(["some-key"], { encrypt: true });
```

On the client it will always be encrypted and there will be no way to decrypt it, while on the server action you will have access with:

```ts
store.get("some-key"); // In the server is automatic decrypted
```

> [!NOTE]
>
> Brisa uses aes-256-cbc for encryption, a combination of cryptographic algorithms used to securely encrypt information recommended by [OpenSSL](https://www.openssl.org/). Encryption keys are generated during the build of your project.

> [!IMPORTANT]
>
> It is important to note that encryption is a blocking process and may increase the time it takes for the request. It also exposes public data for the server action to access. Before using encrypt, consider if there is a better way to have this data from the action like querying a DB, without the need to expose it in the client.

## Props in Server Actions

By default the only props you can access within a server action are other server actions. This is for **security reasons**. In Brisa we do not want to expose server data in the client by default so that later it can be accessed from the server actions. However, you can transfer any server store property to the client allowing to use this value in the server action.

Instead:

```tsx
export default function ServerComponent({ onAction, foo }) {
  function onClickAction(e) {
    onAction(e); // ✅ Server actions are allowed
    console.log(foo.bar); // ❌ foo is undefined
  }

  return <button onClick={onClickAction}>Run action</button>;
}
```

Do this:

```tsx
export default function ServerComponent({ onAction, foo }, { store }) {
  store.set("foo", foo);

  // Encrypt it or not depending on whether it is sensitive data or not.
  store.transferToClient(["foo"], { encrypt: true });

  function onClickAction(e) {
    onAction(e); // ✅ Server actions are allowed
    console.log(store.get("foo").bar); // ✅
  }

  return <button onClick={onClickAction}>Run action</button>;
}
```

If we do not encrypt it you can use the same field of the store in the web components and all the changes you make in the actions will react in all the web components that have the signal.

> [!NOTE]
>
> Learn more in [transfer sensitive data](#transfer-sensitive-data) and in [`store.transferToClient`](/api-reference/components/request-context#transfertoclient) documentation.

## Using Server Actions in a Reverse Proxy

The `POST` request generated by the Server Action consistently yields an HTML stream. This stream may be empty in cases of navigation or when no content is returned. However, to provide guidance to the client code on how to process this stream, the following two headers are essential:

### Request headers

- `X-Action`: This header is the id of the action because the same page can have multi-actions.
- `X-Actions`: This header shares the action dependencies to another action.

### Response headers

- `X-Mode`: This header is crucial for determining whether the stream corresponds to `reactivity` or `transition`.
- `X-Type`: This header indicates the type of the stream, which can be `component` or `page`. This information is essential for the client to understand how to process the stream.
- `X-Navigate`: This header indicates that instead of observing the stream, the client should navigate to another route.
- `X-Cid`: This header returns the id of the component that called the [`rerenderInAction`](/building-your-application/data-fetching/server-actions#rerenderinaction) method with `currentComponent` type. This header is used internally by Brisa to determine which component should be rerendered. When it is not present, the component that fired the action is rerendered.

When utilizing a reverse proxy, it is imperative to ensure the upstream propagation of these headers for seamless communication between the client and the backend server.
