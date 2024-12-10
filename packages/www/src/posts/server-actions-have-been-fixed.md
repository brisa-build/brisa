---
title: "Server Actions have been fixed"
created: 10/20/2024
description: "Server Actions emerged as an idea to reduce client code and simplifying the interactions that require communication with the server. It is an excellent solution that allows developers to write less code. However, there are several challenges associated with its implementation in other frameworks, which should not be overlooked."
author: Aral Roca
author_site: https://x.com/aralroca
tags: javascript, experimental, brisa
cover_image: /images/blog-images/cover_image.jpeg
cover_color: "#1D3D71"
---

[Server Actions](https://brisa.build/building-your-application/data-management/server-actions) emerged as an idea to **reduce client code** and **simplifying the interactions** that require communication with the server. It is an excellent solution that allows developers to write less code. However, there are several challenges associated with its implementation in other frameworks, which should not be overlooked.

In this article we will talk about these problems and how in [**Brisa**](https://brisa.build) we have found a solution.

## Why the need for Server Actions?

To understand what Server Actions provide, it is useful to review how communication with the server used to be. You are probably used to performing the following actions for each interaction with the server:

1. Capture a browser event _(Client)_
2. Normalize and serialize data _(Client)_
3. Make a request to the server _(Client)_
4. Process the request in an endpoint API _(Server)_
5. Respond with the necessary data _(Server)_
6. Wait for the response from the server and process it _(Client)_
7. Update the data on the client and render the changes _(Client)_

These seven actions are **repeated for each interaction**. For example, if you have a page with 10 different interactions, you will repeat a very similar code 10 times, changing only details such as the type of request, the URL, the data sent and the status of the customer.

A familiar example would be
a:

```tsx
<input
  onInput={(e) => {
    // debounce
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fetch("/api/search", {
        method: "POST",
        body: JSON.stringify({ query: e.target.value }),
      })
        .then((res) => res.json())
        .then((data) => {
          setState({ data });
        });
    }, 300);
  }}
/>
```

And in the server:

```js
app.post("/api/search", async (req, res) => {
  const { query } = req.body;
  const data = await search(query);
  res.json(data);
});
```

Increasing the client bundle size... and the frustration of developers.

<figure align="center">
  <img class="center" src="/images/blog-images/frustrated.jpeg" alt="Developer frustrated" />
  <figcaption><small>Frustrated Developer</small></figcaption>
</figure>

## How Server Actions work

Server Actions **encapsulate** these actions in a **Remote Procedure Call (RPC)**, which manages the client-server communication, reducing the code on the client and centralizing the logic on the server:

1. Capture a browser event _(RPC Client)_
2. Normalize and serialize data _(RPC Client)_
3. Make a request to the RPC server _(RPC Client)_
4. Execute the action on the server with the data _(RPC Server)_
5. Option 1:

- Render from the server and send streaming to the client _(RPC Server)_
- Process the chunks of the stream so that the changes are visible _(RPC Client)_

6. Option 2:

- Reply with the necessary data and transfer properties from the server store to the client store _(RPC Server)_
- Make the signals that were listening to the changes react to the changes in the store _(RPC Client)_

Here everything is done for you by the Brisa RPC.

<figure align="center">
  <img class="center" src="/images/blog-images/rpc.jpeg" alt="RPC" />
  <figcaption><small>Remote Procedure Call</small></figcaption>
</figure>

This would be the code from a **server component**:

```tsx
<input
  debounceInput={300}
  onInput={async (e) => {
    // All this code only runs on the server
    const data = await search(e.target.value);
    store.set("query", data);
    store.transferToClient(["query"]);
  }}
/>
```

Here, developers do not write client code, since it is a server component. The `onInput` event is received after the debounce, handled by the Client RPC, while the Server RPC uses "Action Signals" to trigger the Web Components that have signals registered with that store property.

As you can see, this significantly reduces the server code and, best of all, the code size on the client does not increase with each interaction. The RPC Client code occupies a fixed 2 KB, whether you have 10 or 1000 such interactions. This means that **increase 0 bytes** in the client bundle size, with other words, doesn't increase.

<figure align="center">
  <img class="center" src="/images/blog-images/0-bytes.jpeg" alt="0 bytes" />
  <figcaption><small>+0 bytes on client bundle size</small></figcaption>
</figure>

Moreover, in the case of needing a rerender, this is done on the server and is returned in HTML streaming, making the user see the changes much earlier than in the traditional way where you had to do this work on the client after the server response.

In this way:

- **Improve** the user experience (**UX**)
- **Improve** the development experience (**DX**)

<figure align="center">
  <img class="center" src="/images/blog-images/happy.jpeg" alt="Developer happy" />
  <figcaption><small>Happy Developer</small></figcaption>
</figure>

## Differences between Brisa Server Actions and other frameworks

### 1. Numbers of events to capture

In other frameworks such as React, they have focused on actions **only** being part of the **form `onSubmit`**, instead of any event.

This is a problem, since there are many non-form events that should also be handled from a server component without adding client code. For example, an **`onInput`** of an input to do **automatic suggestions**, an **`onScroll`** to load an **infinite scroll**, an **`onMouseOver`** to do a **hover**, etc.

<figure align="center">
  <img class="center" src="/images/blog-images/interactivity.jpeg" alt="Interactivity" />
  <figcaption><small>Applications are more interactive than expected</small></figcaption>
</figure>

### 2. Having more HTML controls over Server Actions

Many frameworks have also seen the HTMX library as a very different alternative to server actions, when in fact it has brought very good ideas that can be combined with Server Actions to have more potential by simply adding extra attributes in the HTML that the RPC Client can take into account, such as the `debounceInput` that we have seen before. Also other HTMX ideas like the `indicator` to show a spinner while making the request, or being able to handle an error in the RPC Client.

<figure align="center">
  <img class="center" src="/images/blog-images/htmx.jpg" alt="HTMX Ideas" />
  <figcaption><small>HTMX ideas</small></figcaption>
</figure>

### 3. Separation of concerns

When Server Actions were introduced in **React**, there was a **new paradigm shift** that many developers had to change the mental chip when working with them.

We wanted to make it as **familiar as possible to the Web Platform**, this way, you can capture the serialized event from the server and use its properties. The only event a little different is the `onSubmit` that has already transferred the `FormData` and has the `e.formData` property, nevertheless, the rest of **event properties** are interactable. This is an example **resetting a form**:

```tsx
import type { RequestContext } from "brisa";

export default function FormOnServer({}, { indicate }: RequestContext) {
  const pending = indicate("action-name");

  return (
    <form
      indicateSubmit={pending}
      onSubmit={(e) => {
        // This code runs on the server
        console.log("Username:", e.formData.get("username"));
        e.target.reset(); // Tell to the RPC client to reset the form
      }}
    >
      <label>
        Username:
        <input type="text" name="username" />
      </label>
      <br />
      <button indicator={pending} type="submit">
        Submit
      </button>
    </form>
  );
}
```

In this example, there is no client code at all and during the server action you can **disable the submit button** with the `indicator`, using CSS, so that the form cannot be submitted twice, and at the same time after doing the action on the server and **access the form data** with `e.formData` and then **resetting the form** using the same API of the event.

Mentally, it is very **similar** to working with the **Web Platform**. The only difference is that all the events of all the server components are server actions.

This way, there is a real separation of concerns, where it is **NOT necessary** to put **`"user server"`** or **`"use client"`** in your components **anymore**.

Just keep in mind that **everything runs only on the server**. The only **exception** is for the **`src/web-components`** folder which runs on the **client** and there the **events are normal**.

<figure align="center">
  <img class="center" src="/images/blog-images/separation-concers.jpeg" alt="Two different worlds, but in agreement" />
  <figcaption><small>Two different worlds, but in agreement</small></figcaption>
</figure>

### 4. Event Propagation

In Brisa, the Server Actions are propagated between Server Components as if they were DOM events. That is to say, from a Server Action you can call an event of a prop of a Server Component and then the Server Action of the parent Server Component is executed, etc.

```tsx
export default function Example({ onAfterMyAction }) {
  return (
    <ChildComponent
      indicateSubmit={pending}
      onSubmit={(e) => {
        const username = e.formData.get("username");
        /* Process data */
        onAfterMyAction(username); // call server component prop
        e.target.reset();
      }}
    />
  );
}
```

In this case, the `onAfterMyAction` event is executed on the parent component and an action can be done on the server. This is very useful to make actions on the server that effect **several server components**.

<figure align="center">
  <img class="center" src="/images/blog-images/after-my-action.jpg" alt="Propagate action" />
  <figcaption><small>Propagate action</small></figcaption>
</figure>

### 4. Comunication between both worlds

Especially after the last few weeks Web Components have been a bit frowned upon after several discussions on X (formelly Twitter). However, being **part of the HTML**, it is the **best way** to **interact with Server Actions** for several reasons:

1. You can **capture** any **Web Component event** from the **server** and generate client-server communication. Example `<web-component onEvent={serverAction} />`. This is very powerful, since all the events inside the Web Component is only client logic without putting any server logic there, simply from the server when consuming the Web Component you can do server actions.
2. The **HTTP protocol** can be used for what it was designed for, to **transfer Hypertext** (HTML) in **streaming**, this way if after a re-rendering from a Server Action any attribute of a Web Component is updated, the diffing algorithm of the RPC Client makes the Web Component to be updated without much effort. The Web Components **attributes** in Brisa **are signals** that make the internal parts of Web Component react without having to rerender. This process in other frameworks becomes very complicated, making the RPC server have to process JSON or JS over the wire, instead of HTML, which makes the streaming implementation more complicated.

Using attributes in Web Components requires serialization in the same way as transmitting data from server to client without using Web Components, therefore, using both, there is **no extra serialization** to manage.

_**Note:** Streaming HTML and processing it with the diffing algorithm is something I explained in this other [article](https://aralroca.com/blog/html-streaming-over-the-wire) if you are interested._

<figure align="center">
  <img class="center" src="/images/blog-images/hypertext-over-the-wire.jpeg" alt="Hypertext in streaming over the wire" />
  <figcaption><small>Hypertext in streaming over the wire</small></figcaption>
</figure>

### 5. New concept: Action Signals

In Brisa, we have added a new concept to give even more power to the Server Actions, this concept is called [**"Action Signals"**](https://brisa.build/building-your-application/data-management/server-actions#action-signals). The idea of the "Action Signals" is that you have **2 stores**, one on the **server** and one on the **client**.

**Why 2 stores?**

The default **server store** **lives** only at the **request level**. And you can **share data** that will **not be visible** to the **client**. For example you can have the middleware set the user and have access to sensitive user data in any Server Component. By living at request level it is impossible to have conflicts between different requests, since **each request** has its **own store** and is **NOT stored in any database**, when the request is finished, it dies by default.

On the other hand, in the **client store**, it is a store that **each property** when consumed is a [**signal**](https://brisa.build/building-your-application/components-details/reactivity), that is to say, if it is updated, the Web Component that was listening to that signal reacts.

However, the new concept of **"Action Signal"** is that we can **extend the life of the server store beyond the request**. To do this it is necessary to use this code:

```tsx
store.transferToClient(["some-key"]);
```

This [`transferToClient`](https://brisa.build/api-reference/components/request-context#transfertoclient) method, **share server data** to the **client store** and converted into signals. In this way, many times it will not be necessary to make **any re-rendering** from the server, you can simply from a Server Action make react the signals of the Web Components that were listening to that signal.

This store transfer makes the **life of the server store** now:

_Render initial Server Component → Client → Server Action → Client → Server Action..._

So it goes from living from only at request level to **live permanently**, compatible with navigation between pages.

<figure align="center">
  <img class="center" src="/images/blog-images/share-data.jpg" alt="Share data between both worlds" />
  <figcaption><small>Share data between both worlds (server/client)</small></figcaption>
</figure>

Example:

```tsx
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

        // renderComponent is used to make the server components reactively react
        // to the store change as well. If renderComponent is not used, only the
        // web components that are listening to the store.get('errors') signal
        // react to the changes.
        renderComponent();
      }}
    >
      <input name="email" type="text" />
      {errors?.email && <p>{errors.email._errors.toString()}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

In this example, we extend the life of the `errors` store property, not to be used on the client, but to be reused in the Server Action and then finally in the rerender of the Server Action. In this case, being a non-sensitive data, it is not necessary to encrypt it. This example code all happens on the server, even the rerendering and the user will see the errors after this rendering on the server where the Server RPC will send the HTML chunks in streaming and the Client RPC will process it to make the diffing and show the errors to give feedback to the user.

### 6. Encrypt only the sensitive data

If within a server action some variable is used that existed at render level, at security level many frameworks like [**Next.js 14**](https://nextjs.org/blog/security-nextjs-server-components-actions#closures) what they do is to encrypt this data to create an snapshot of data used at the time of rendering. This is more or less fine, but **encrypting data always** has an associated **computational cost** and it is not always sensitive data.

In Brisa, to solve this, there are different requests, where in the initial render it has a value, and in the server action you can capture the value that it has in this request.

```tsx
export default function Page() {
  const foo = "bar";

  function onServerAction() {
    if (foo === "bar") {
      // It works without transferring "foo" to the client
    }
  }

  return <button onClick={onServerAction}>Click</button>;
}
```

This is useful in some cases but not always, for example if you do a `Math.random` it will be different between the initial render and the Server Action execution for sure.

```tsx
export default function Page() {
  const value = Math.random();
  // Ex: 0.123456789 (Initial render) - 0.987654321 (Server Action)

  function onServerAction() {
    if (value === 0.123456789) {
      // 😕 Ups! It's wrong condition
    }
  }

  return <web-component onAction={onServerAction}></web-component>;
}
```

This is why we created the concept of **"Action Signals"**, to **transfer data** from the **server store** to the **client store**, and the **developer** can **decide** whether to **encrypt** it **or not** at will.

Sometimes, instead of querying the database from the Server Action, you may want to transfer data that already exists in the initial render even if it requires an associated encryption. To do this, you simply use:

```js
store.transferToClient(["some-key"], { encrypt: true });
```

When you do:

```js
const value = store.get("some-key");
```

Inside a Web Component (client) will always be encrypted, but on the server it will always be decrypted.

_**Note**: Brisa uses aes-256-cbc for encryption, a combination of cryptographic algorithms used to securely encrypt information recommended by OpenSSL. Encryption keys are generated during the build of your project._

<figure align="center">
  <img class="center" src="/images/blog-images/encrypt.jpg" alt="Share encrypted data between both worlds" />
  <figcaption><small>Share encrypted data between both worlds (server/client)</small></figcaption>
</figure>

## Conclusion

In Brisa, although we like to support writing Web Components easily, the goal is to be able to make a SPA without client code and only use Web Components when it is a purely client interaction or the Web API has to be touched. That's why Server Actions are so important, as they allow interactions with the server without having to write client code.

We encourage you to [try Brisa](https://brisa.build/getting-started/quick-start), you just have to run this command in the terminal: `bun create brisa`, or try some [example](https://brisa.build/examples) to see how it works.

## References

- [Server Actions Convetion](https://brisa.build/building-your-application/data-management/server-actions#convention)
- [Server Actions Behavior](https://brisa.build/building-your-application/data-management/server-actions#behavior)
- [Forms with Server Actions](https://brisa.build/building-your-application/data-management/server-actions#forms)
- [Nested Actions](https://brisa.build/building-your-application/data-management/server-actions#nested-actions)
- [Server-side validation and error handling](https://brisa.build/building-your-application/data-management/server-actions#server-side-validation-and-error-handling)
- [Debounce a Server Action](https://brisa.build/building-your-application/data-management/server-actions#debounce)
- [Optimistic Updates](https://brisa.build/building-your-application/data-management/server-actions#optimistic-updates)
- [Re-render in Action](https://brisa.build/building-your-application/data-management/server-actions#rerenderinaction)
- [Navigate to another page with Server Actions](https://brisa.build/building-your-application/data-management/server-actions#navigate)
- [Access to Cookies](https://brisa.build/building-your-application/data-management/server-actions#cookies)
- [Security in Server Actions](https://brisa.build/building-your-application/data-management/server-actions#security)
- [Action Signals](https://brisa.build/building-your-application/data-management/server-actions#action-signals)
- [Transfer sensitive data](https://brisa.build/building-your-application/data-management/server-actions#transfer-sensitive-data)
- [Props in Server Actions](https://brisa.build/building-your-application/data-management/server-actions#props-in-server-actions)
- [Using Server Actions in a Reverse Proxy](https://brisa.build/building-your-application/data-management/server-actions#using-server-actions-in-a-reverse-proxy)
