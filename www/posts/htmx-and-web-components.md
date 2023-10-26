---
title: "Brisa: HTMX & Web Components"
description: Algorithm to transform Brisa components to similar behavior of HTMX and to Web Components
---

This post explains the approach taken to develop algorithms that allow components similar to React and a framework like Next.js (Brisa) to also have behavior more inspired by libraries like HTMX and LitElement.

The Brisa framework has been strongly inspired by: Next.js (React), HTMX and LitElement.

In Brisa, components are server-components by default. And it is possible to have more server-components since the focus is for you to be able to use state and events within them! Yes, you heard that right, in principle you could use an interactive SPA using only server-components.

However, it is not always recommended to use server-components and it is good to also have client-components.

## When to use client-components (web-components)

There are two important points that will make you need to use client-components:

- When you need to interact with the Web API
- For interactions that do not require making requests to the server. For example, it would not make sense to use a server-component for a spreadsheet cell.

## When to use server-components

Whenever interaction with the Web API is not required, and when interactions require interaction with the server.

## Next.js (React) inspiration

When React came out and the concept of "components" emerged, it revolutionized how the web is built. The concept of working with components allows you to easily reuse code and each component has a single responsibility that can be tested properly. The fact of using JSX allowed having the JS, HTML and CSS to perform the component's functionality all in one small place (component). So one of Brisa's motivations is for developers to continue making their projects using functional components with JSX.

Next.js inspired a lot its way of managing SSR with React and how to have isomorphic files that can be used both on the server side and the client side.

Brisa has been inspired by the Next.js-style routing (pages router) to define pages but with an approach similar to app router, since by default all components are server-components.

## HTMX inspiration

When thinking about server-components, we wondered why they could not have state and events, and why this interaction could not be made similar to how HTMX does it. HTMX extends hypermedia controls so that there are more than 2 (a and form) and server-client communication is via text/html.

To facilitate the integration of the HTMX idea but using behavior similar to React components without having to manually add these hypermedia controls and minimize code on the client, what Brisa does is change the implementation approach.

Communicating with HTML is in fact one of the principles on which protocols like HTTP (Hypertext Transfer Protocol) were created. Later, support was added to transmit JSON and in recent years with the React revolution there was a strong tendency to do the following:

1. Perform an action from the client side
2. Capture the event and process data
3. Make a request to the server
4. Receive a JSON from the server
5. Process the JSON
6. Render new HTML

HTMX proposes to solve these requests through hypermedia controls and simplify it to:

1. Perform an action from the client side
2. Automatically make the request to the server via the hypermedia control
3. The server returns the HTML and the hypermedia control replaces the part of the web that corresponds with the HTML received

For developers, to implement an action, you only need to define its behavior in the HTML attributes and the hypermedia-control does it automatically without having to implement all of this. This is beneficial because it greatly reduces client-side code, the only thing needed is the HTMX library to handle these controls. If one day this becomes an HTML specification then there won't be any client-side code needed, but right now a library is still required to manage it for you.

With Brisa, we want to do something similar, although not identical. We want to maintain the concept of reducing developer effort in a way similar to HTMX so they don't have to implement these actions from the client and since we are working with server-components, it is done there so there is no need to communicate with any server because everything will be done from the server. What I mean by this is that in server-components we have state and we can modify it from a handler, then a rerender of the component is made from the server and this code is sent to the client. Of course, the initial action will be made from the client because user interactivity is needed, but the implementation is moved to the server.

This way, it would be:

1. Perform action from client side
2. Automatically make request to server and Brisa executes action and rerenders component
3. Server returns HTML and Brisa-client replaces corresponding part of web with received HTML

```js
import { Database } from "bun:sqlite";

const db = new Database(":memory:");

const userQuery = db.query(
  "SELECT firstName, lastName, ranking FROM users WHERE id = ?;",
);

const updateRanking = db.prepare("UPDATE users SET ranking = ? WHERE id = ?");

export default function UserInfo({ id }, { rerender, i18n: { t } }) {
  const { firstName, lastName, ranking } = userQuery.get(id);

  const increaseRanking = () => {
    updateRanking.run(ranking + 1, id);
    rerender();
  };

  return (
    <>
      <h1>{t("hello", { firstName, lastName })}</h1>
      <client-component ranking={ranking} />
      <button onClick={increaseRanking}>{t("increase-ranking")}</button>
    </>
  );
}

UserInfo.error = ({ error }, { i18n: { t } }) => {
  if (error instanceof Database.SqliteError) {
    return <div>{t("error-updating-user-ranking")}</div>;
  }

  return <div>{t("error-generic")}</div>;
};
```

What changes here is that the hypermedia-control does not exist at the HTML attribute level. Furthermore, the client receives the new HTML and replaces it automatically, but it doesn't really receive the HTML in text format, rather the client receives the DOM operations that must be performed to minimally alter the HTML and in this way part of the analysis is done from the server side.

Therefore, we cannot say that Brisa uses hypermedia to send HTML in text format, rather we send streaming text of the DOM operations along with the HTML selectors to apply these operations.

An example of chunks that can be received during the streaming response:

Chunk 1:

```json
{
  "selector": "div > a",
  "action": "setAttribute",
  "params": ["style", "color:red;"]
}
```

Chunk 2:

```json
{
  "selector": "div a:last-child",
  "action": "removeAttribute",
  "params": ["style"]
}
```

Chunk 3:

```json
{ "selector": "div span:last-child", "action": "remove", "params": [] }
```

Chunk 3:

```json
{
  "selector": "main > div",
  "action": "insertAdjacentHTML",
  "params": ["afterend", "<b>Example</b>"]
}
```

Chunk 3:

```json
{
  "selector": "main > div > b",
  "action": "innerHTML",
  "params": ["Hello world"]
}
```

Only 4 operations supported by all browsers: `setAttribute`, `removeAttribute`, `remove`, `insertAdjacentHTML`, `innerHTML`. With these 4 operations the DOM can be modified delicately without altering states or events registered by the client portion.

The reasons for choosing JSON again instead of HTML (I'm referring to again because the web was invented to transfer HTML, we added support to transfer JSON to do more complex things from the client and then re-thought it with HTMX to expand the use of HTML to avoid unnecessary complexities):

- Process more simply from the client, making it so there is hardly any need to bring Bytes in the client to manage this.
- Operate directly with the DOM to update only the part of the HTML that changes and maintain exactly the same one, avoiding loss of states and events from web-components.

## Events and state on the server

### 1. Build process

During the build all events in JSX are detected and the following is done:

#### Transform original component

A hexadecimal index of the component that has >= 1 event is created, for example if there are already 1003 components with events throughout the project, it would have the id `3eb`:

```jsx
function SomeComponent({ name }) {
  return (
    <button
      onClick={() => {
        console.log(name);
      }}
    >
      Click
    </button>
  );
}
```

The id is placed in the original component and the event is replaced by executing the action `$a(idComp, idAction)` while the original event is preserved by adding `$` at the end:

```jsx
function SomeComponent({ name }) {
  return (
    <button
      onClick$={() => {
        console.log(name);
      }}
      onClick="$a('3eb', 1)"
    >
      Click
    </button>
  );
}

SomeComponent._id = "3eb";
```

This would also solve it if we have the event in prop drilling form:

```jsx
function SomeComponent({ name }) {
  return (
    <ButtonComponent
      onClick$={() => console.log("Hello world")}
      onClick="$a('3eb', 1)"
    >
      Click
    </ButtonComponent>
  );
}

SomeComponent._id = "3eb";
```

Since the execution of the static value `$a('3eb', 1)` would be passed to where it needs to be executed.

However, this component does not receive any transformation:

```jsx
function ButtonComponent({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}
```

Similarly, if we have a client event (string) from a server-component it is also not transformed:

```js
function Example() {
  return (
    <img src="/images/image.jpg" onError="this.src='/images/fallback.jpg'" />
  );
}
```

#### Create the action (post build)

Based on the original:

```jsx
function SomeComponent({ name }) {
  return (
    <button
      onClick={() => {
        console.log(name);
      }}
    >
      Click
    </button>
  );
}
```

We create a new version inside `/_actions/3eb.js`, transforming the original file to this:

```jsx
export default function ({ name }) {
  const _events = new Set();
  const _action = (handler) => {
    _events.add(handler);
    return `$a('3eb', ${events.size - 1})`;
  };

  return {
    render: () => (
      <button
        onClick={_action(() => {
          console.log(name);
        })}
      >
        Click
      </button>
    ),
    events: () => _events,
  };
}
```

In case of consuming signals and having more logic in the component:

```jsx
function SomeComponent({ name }, { i18n, useSignal }) {
  const count = useSignal(0);
  const [firstName] = name.split(" ");
  const incEl = (
    <button onClick={inc}>{i18n.t("increment", { firstName })}</button>
  );
  const decEl = (
    <button onClick={() => count.value--}>{i18n.t("decrement")}</button>
  );

  const inc = () => {
    console.log(firstName);
    count.value++;
  };

  return (
    <>
      {incEl}
      {count.value}
      {decEl}
    </>
  );
}
```

It would move to `/_actions/3eb.js` transforming it to:

```jsx
export default function ({ name }, { i18n, useSignal }) {
  const _events = new Set();
  const _action = (handler) => {
    _events.add(handler);
    return `$a('3eb', ${events.size - 1})`;
  };

  return {
    render: () => {
      _events.clear();

      const count = useSignal(0);
      const [firstName] = name.split(" ");
      const incEl = (
        <button onClick={_action(inc)}>
          {i18n.t("increment", { firstName })}
        </button>
      );
      const decEl = (
        <button onClick={_action(() => count.value--)}>
          {i18n.t("decrement")}
        </button>
      );

      const inc = () => {
        console.log(firstName);
        count.value++;
      };

      return (
        <>
          {incEl}
          {count.value}
          {decEl}
        </>
      );
    },
    events: () => _events,
  };
}
```

In the case of having weird things like:

```jsx
const btnFn = (name) =>
  name && (
    <button onClick={() => console.log("Hello from server")}>Hello</button>
  );

function SomeComponent({ name }) {
  return btnFn(name);
}
```

Since this transformation is done during post-build, an optimization would have already been done to the page component so we would have something like this:

```jsx
function SomeComponent({ name }) {
  return (
    name && (
      <button onClick={() => console.log("Hello from server")}>Hello</button>
    )
  );
}
```

And therefore we can apply the same post-build transformation rule:

```jsx
export default function ({ name }) {
   const _events = new Set();
   const _action = (handler) => {
    _events.add(handler);
    return `$a('3eb', ${events.size - 1})`;
  };


  return {
    render: () => name && <button onClick={_action(() => console.log("Hello from server"))}>Hello</button>,
    events: () => _events,
}
```

### 2. Runtime process

During the `renderToReadableStream` method, the idea is to see which components have `._id`, and then this means that the HTML returned by the component must be wrapped with a comment that has the prop values ​​and signals (by passing the request in each component we can access to obtain the signal values).

This component without signals:

```jsx
function SomeComponent({ name }) {
  return <button onClick="$a('3eb', 1)">Click</button>;
}

SomeComponent._id = "3eb";
```

Would be printed in html as:

```html
<!--BC-3eb name="Aral"--><button onClick="$a('3eb', 1)">Click</button
><!--/BC-3eb-->
```

The idea of ​​doing it this way is to not introduce new nodes to avoid overloading the DOM and also so that when calling the action, the piece of HTML between this comment is passed since it is the current HTML of the component and then during the server action it will analyze the changes with the new HTML to return the necessary DOM operations.

And with signals:

```jsx
function SomeComponent({ name }, { i18n, useSignal }) {
  const count = useSignal(0);
  const [firstName] = name.split(" ");
  const incEl = (
    <button onClick="$a('3eb', 1)">{i18n.t("increment", { firstName })}</button>
  );
  const decEl = <button onClick="$a('3eb', 2)">{i18n.t("decrement")}</button>;

  return (
    <>
      {incEl}
      {count.value}
      {decEl}
    </>
  );
}

SomeComponent._id = "3eb";
```

It would be printed in html as:

```html
<!--BC-3eb name="Aral" _signals=[0]-->
<button onClick="$a('3eb', 1)">Increment</button>
0
<button onClick="$a('3eb', 2)">Decrement</button>
<!--/BC-3eb-->
```

If there are multiple identical components, the component id is added with `:index``:

```html
<!--BC-3eb:2 name="Aral" _signals=[0]-->
<button onClick="$a('3eb:2', 1)">Increment</button>
0
<button onClick="$a('3eb:2', 2)">Decrement</button>
<!--/BC-3eb:2-->
```

The `props` values ​​ONLY when a component uses events become visible in the HTML, and the signal values ​​ALWAYS. This is very important to keep in mind so as not to expose sensitive data. If a component needs sensitive data it can be passed through the request context and expose within a signal only the non-sensitive part that is wanted as state:

```jsx
function SomeComponent({}, { i18n, useSignal, context, rerender }) {
  const user = context.get("user"); // Some user data is delicated
  const firstName = useSignal(user.firstName); // add this signal to HTML to use it in events
  const incEl = (
    <button onClick={inc}>{i18n.t("increment", { firstName })}</button>
  );
  const decEl = (
    <button onClick={() => count.value--}>{i18n.t("decrement")}</button>
  );

  const inc = () => {
    console.log(firstName);
    count.value++;
    rerender();
  };

  return (
    <>
      {incEl}
      {count.value}
      {decEl}
    </>
  );
}
```

### 3. Consuming the action

It is done in this way because the idea to consume this action would be:

1. The current HTML together with the props and the signals would be received in the request.
2. To mount the request context first initializing the signals to the last values. The signals are stored inside the HTML, so when calling `$a(idComp, idAction)` this function is in charge of making the request passing the last values of the signals so that the server can have the context.
3. The `events` would be called and the event of the action would be executed.
4. The `render` would be called and the HTML would be obtained.

Of this part, the most important is how to obtain the DOM operations after comparing both HTMLs. This is where the algorithm comes into play.

## Events and state on the client

On the client, the idea is to create web-components in a similar way to server-components, but there the events run on the client, being able to access the Web API:

```tsx
import { onMount, onUnmount } from 'brisa';

export default function UserInfo({ firstName, lastName, ranking, onSave }, { i18n: { t }, useSignal, ws }) {
  const newRanking = useSignal(ranking);
  const onMessage = (message) => alert(message)

  onMount(() => {
    ws.addEventListener('message', onMessage);
  })

  onUnmount(() => {
    ws.removeEventListener('message', onMessage);
  })

  const inc = () => {
    newRanking.value++
    alert(t('increased-ranking-to', { to: newRanking.value }))
  }

  return (
    <>
      <h1>{t("hello", { firstName, lastName })}</h1>
      <p>{t('ranking', { ranking: newRanking.value })}</p>
      <button onClick={(inc}>{t("increase-ranking")}</button>
      <button onClick={() => onSave(newRanking.value)}>{t("save-ranking")}</button>
    </>
  );
}
```

In this example, we have a `/web-component/user-info.tsx` where everything that happens here is part of the client and therefore we can do the `alert` without problems. However, we can communicate web-component events with server-components like the `onSave` example, which if the parent component is a server-component can have the event implemented there:

server-component:

```tsx
export default function ServerComponent({ user }, { rerender, ws, i18n }) {
  const onSave = async (ranking) => {
    await db`UPDATE users SET ranking = ${ranking} WHERE id = ${user.id}`;
    ws.send(i18n.t("saved-new-ranking", { ranking }));
  };

  return (
    <user-info
      firstName={user.firstName}
      lastName={user.lastName}
      ranking={user.ranking}
      onSave={onSave}
    />
  );
}
```

In this example it uses WebSockets to communicate with web-components after having saved, in case any web-component needs to make any update using the Web API.

### Transformation to web-component

During client code build that has the following component is transformed:

```tsx
export default function Count({ name }, { $state }) {
  const count = $state(0);

  return (
    <p>
      <button onClick={() => count.value++}>+</button>
      <span>{` ${name} ${count.value} `}</span>
      <button onClick={() => count.value++}>-</button>
    </p>
  )
}
```

to this web-component:

```tsx
export default class Counter extends BrisaElement {
  static get observedAttributes() {
    return ['name'];
  }
  r({ name }, { $state, $effect, c }) {
    const count = $state(0);
    const inc = c('button');
    inc.textContent = '+';
    inc.addEventListener('click', () => count.value++)

    const countEl = c('span');
    $effect(() => countEl.textContent = ` ${name.value} ${count.value} `);

    const dec = c('button');
    dec.textContent = '-';
    dec.addEventListener('click', () => count.value--);

    const p = c('p');
    p.appendChild(inc);
    p.appendChild(countEl);
    p.appendChild(dec);

    this.els = [p];
  }
}
```

Where `BrisaElement` is:

```ts
function requestContext() {
  let current = 0

  return {
    $state<T>(initialValue: T): { value: T } {
      const effects = new Set()
      return {
        get value() {
          if (current) effects.add(current)
          return initialValue
        },
        set value(v) {
          initialValue = v
          effects.forEach((effect) => effect())
        }
      }
    },
    $effect(fn: () => void) {
      current = fn
      fn()
      current = 0
    },
    c: document.createElement.bind(document)
  }
}

class BrisaElement extends HTMLElement {
  connectedCallback() {
    const ctx = requestContext()
    this.p = {};

    for (let attr of this.constructor.observedAttributes || []) {
      this.p[attr] = ctx.$state(this.getAttribute(attr));
    };

    this.r(this.p, ctx)
    this.els.forEach((el) => this.appendChild(el));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.p || oldValue === newValue) return;
    this.p[name].value = newValue;
  }
}
```