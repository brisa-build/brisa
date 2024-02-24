---
title: Server Actions
nav_title: Server Actions
description: Learn how to handle events in the server and form submissions with Brisa.
---

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

## Behavior

- Server Actions are not limited to `<form>` and can be invoked from any element like `<button>`.
- Server Actions are Hypermedia-driven, when an action is invoked, it can respond new HTML and update the UI only by affecting the parts of the DOM that have modified and the web-components can respond reactively to the changes, all in a single round-trip from the server.
- Behind the scenes, actions use the `POST` method, and only this HTTP method can invoke them.
- When an action is invoked the [`preventDefault`](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault) is automatic called.
- Server Actions serialize the event to access it from the server. In the case of `onSubmit`, it process the `formData` to send it to the server, then the event changes from [`SubmitEvent`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) to [`FormDataEvent`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event), so you can access directly to the `e.formData`.
- Server Actions are functions. This means they can be reused anywhere in your application.

> [!CAUTION]
>
> Server actions only work with the `output: "server"` [configuration](/docs/building-your-application/configuring/output) (the default).

### Forms

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
> > When working with forms that have many fields, you may want to consider using the [`entries()`](https://developer.mozilla.org/en-US/docs/Web/API/FormData/entries) method with JavaScript's [`Object.fromEntries()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries). For example: `const rawFormData = Object.fromEntries(formData.entries())`

### Server-side validation and error handling

We recommend using HTML validation like `required` and `type="email"` for basic client-side form validation.

For more advanced server-side validation, you can use a library like [zod](https://zod.dev/) to validate the form fields before mutating the data, together with [state](#server-side-state). Whether `state` can be used in server components for non-sensitive data. Brisa will serialize the `state` of the server components and it will live in the HTML:

```tsx
import type { RequestContext } from "brisa";
import { z } from "zod";

const schema = z.object({
  email: z.string({
    invalid_type_error: "Invalid Email",
  }),
});

function Errors(props: { errors?: string[] }) {
  if (!props.errors?.length) return null;
  return (
    <div>
      {props.errors.map((err) => (
        <p key={err}>{err}</p>
      ))}
    </div>
  );
}

export default function Form({}, { state }: RequestContext) {
  const errors = state();

  return (
    <form
      onSubmit={(e) => {
        const email = e.formData.get("email");
        const result = schema.safeParse({ email });

        if (!result.success) {
          errors.value = result.error.format();
        }
      }}
    >
      <Errors errors={errors?.value?.name?._errors} />
    </form>
  );
}
```

> [!IMPORTANT]
>
> Before mutating data, you should always ensure a user is also authorized to perform the action. See [Authentication and Authorization](#authentication-and-authorization).

TODO: Check that this example works after server-side state implementation

### Debounce

Brisa extends all the HTML element events (`onInput`, `onMouseOver`, `onTouchStart`...) to allow to debounce the action call by adding an extra attribute with the `-debounce` suffix.

```tsx
<input
  type="text"
  onInput={(e) => console.log(e.target.value)}
  onInput-debounce={400}
/>
```

The time unit consistently remains in milliseconds. In this example, the call to the server and consequently the execution of `console.log` will only take place `400ms` after the user ceases typing in the textbox.

> [!CAUTION]
>
> This is only implemented for server actions, for web component events it does not apply since we do not modify the original event.

### Server-side state

TODO

### Optimistic updates

TODO

### `rerenderInAction`

The [`rerenderInAction`](/docs/api-reference/functions/rerenderInAction) method is used to rerender the component or the page
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

TODO

### `navigate`

If you would like to navigate the user to a different route after the completion of a Server Action, you can use [`navigate`](/docs/app/api-reference/functions/navigate) API. `navigate` needs to be called outside of the `try/catch` block:

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

### Cookies

You can access to the request inside the server action to read cookies from headers, then you can communicate via request store to the [`responseHeaders`](/docs/building-your-application/routing/pages-and-layouts#response-headers-in-layouts-and-pages) of the page:

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

export function responseHeaders(request: RequestContext) {
  // Read the stored data:
  const newCookies = req.store.get("new-cookies");

  return {
    "Set-Cookie": req.store.get("new-cookies"),
  };
}
```

TODO: Check that is working the example

## Security

### Authentication and authorization

You should treat Server Actions as you would public-facing API endpoints, and ensure that the user is authorized to perform the action. For example:

```tsx
import { Database } from "bun:sqlite";
import type { RequestContext } from "brisa";
import validateToken from "@/auth/validate-token";

const db = new Database("mydb.sqlite");
const insertCat = db.prepare("INSERT INTO cats (name) VALUES ($name)");

export default function Login({}, req: RequestContext) {
  return (
    <form
      onSubmit={async (e) => {
        const auth = req.headers.get("authorization");
        const [authType, token] = authHeader?.split(" ") ?? [];
        const isTokenValid = await validateToken(token);

        if (isTokenValid) {
          insertCat.run(e.formData.get("cat-name"));
        }

        // handle invalid token
      }}
    >
      {/* ... */}
    </form>
  );
}
```

TODO: Verify that is working the example

### Action Signals

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

> render _(server)_ → HTML _(client)_ → action _(server)_ → render _(server)_ → ...

For these cases, you can use the **action signals** through the [`state`](#server-side-state) method to improve the communication between render and action.

```tsx filename="src/pages/index.tsx"
import type { RequestContext } from "brisa";

export default function Page({}, { state }: RequestContext) {
  // set communication render-value
  const foo = state(Math.random());

  function onClick() {
    // get communication render-value
    const renderFooValue = foo.value;
    // ..
    // set communication action-render:
    foo.value = Math.random();
  }

  return (
    <button onClick={onClick}>
      {/* display "render" and "action" value */}
      {foo.value}
    </button>
  );
}
```

Only in these cases, the `state` will be exposed in the HTML, via comments.

> [!TIP]
>
> Changing the value of the action signal within the action will also reflect the change in the rendering. The concept is similar to the `state` of web components.

> [!IMPORTANT]
>
> The values of the action signals (`state`) must be [serializable](https://developer.mozilla.org/en-US/docs/Glossary/Serialization).

> [!CAUTION]
>
> The `state` values are for **NON-SENSITIVE DATA** only. These values are shared through HTML. If you need sensitive data, it is almost better to get it inside the server action. Or transmit in the action signal a key of a key-value DB such as Redis.

TODO: Verify that this section is working fine after implement the state in server.

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

## Using Server Actions in a Reverse Proxy

The `POST` request generated by the Server Action consistently yields an HTML stream. This stream may be empty in cases of navigation or when no content is returned. However, to provide guidance to the client code on how to process this stream, the following two headers are essential:

### Request headers

- `X-Action`: This header is the id of the action because the same page can have multi-actions.
- `X-S`: This header shares the client store to has access inside the action

### Response headers

- `X-Mode`: This header is crucial for determining whether the stream corresponds to `reactivity` or `transition`.
- `X-Navigate`: This header indicates that instead of observing the stream, the client should navigate to another route.
- `X-S`: This header shares only the modified store that was already the client's and the one that was transferred with the [`transferToClient`](/docs/building-your-application/routing/pages-and-layouts) method.

When utilizing a reverse proxy, it is imperative to ensure the upstream propagation of these headers for seamless communication between the client and the backend server.
