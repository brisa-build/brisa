---
description: Understand how to use server components in Brisa.
---

# Server Components

Remember that everything in Brisa (`pages`, `layout`, `middleware`, `api`...) runs on the server. The only exception are the `web-components` folder, so, the rest of Brisa components will be Server Components. Brisa applies **Server Side Rendering (SSR)** of the server components and does not carry JavaScript code to the client.

They should be imported and consumed in JSX, This is how you can distinguish between a server-component and a web-component; Server components will always be consumed in `PascalCase` in the JSX, while web components are in `kebab-case` without import, like other HTML Elements.

```jsx
import ServerComponent from "@/components/server-component";

// ...
<body>
  <ServerComponent />
  <web-component />
</body>;
```

It is a way for your server components to have only server code.

You can be 100% sure that all the code here runs ONLY on the server. All events that are captured in the Server Components are [Server Actions](/building-your-application/data-fetching/server-actions), therefore they are executed on the server without needing JS code on the client:

```tsx
<ServerComponent onClick={e => console.log('This console.log is on the server', e)} />
<web-component onAction={(e) => console.log('Capturing a web-component event on the server', e)} />
<button onClick={() => console.log('click handled in the server')}>Click</button>
```

## Differences with Web Components

Although the server components are interactive in Brisa, the interactivity of the server components is more focused on interactivity where the server is involved. It would not make sense to do the interactivity on the server for Spreadsheet cell components, since all this interactivity could be on the client avoiding constant calls to the server.

[Web components](/building-your-application/components-details/web-components.md) are fully reactive thanks to [signals](/building-your-application/components-details/web-components.md#state-state-method), and you can access the [Web API](https://developer.mozilla.org/en-US/docs/Web/API).

## Creating a Server Component

Server Components can be created anywhere except inside the `web-components` folder.

Example:

```sh
.
└── components
    └── server-component.tsx
```

And it has to be a JSX component:

```tsx
export default function ServerComponent({ children }) {
  return (
    <main>
      <h1>Hello World</h1>
      {children}
    </main>
  );
}
```

## Props

Brisa components use _props_ to communicate with each other. Every parent component can pass some information to its child components by giving them props. Props might remind you of HTML attributes, but you can pass any JavaScript value through them, including objects, arrays, and functions (server actions).

### Step 1: Pass props to the child component

First, pass some props to `user-images`. For example, let’s pass three props: urls (array of strings), width and height (number):

`src/components/user-info.tsx`:

```tsx
import UserImages from "@/components/user-images";

export default function UserInfo() {
  return (
    <UserImages
      urls={["some-image.jpg", "another-url.jpg"]}
      width={300}
      height={300}
    />
  );
}
```

Now you can read these props inside the `UserImages` component.

### Step 2: Read props inside the child component

You can read these props by listing their names `urls`, `width`, `height` separated by the commas inside `({` and `})` directly after `function UserImages`. This lets you use them inside the `UserImages` code, like you would with a variable.

`src/components/user-images.tsx`:

```tsx
export default function UserImages({ urls, width, height }) {
  // urls, width and height are available here
  return urls.map((imageUrl) => (
    <img
      class="avatar"
      key={imageUrl}
      src={imageUrl}
      alt="probably we can add this 'alt' to prop also"
      width={width}
      height={height}
    />
  ));
}
```

### Specifying a default value for a prop

If you want to give a prop a default value to fall back on when no value is specified, you can do it with the destructuring by putting `=` and the default value right after the parameter:

```tsx
export default function UserImages({ urls = [], width = 300, height = 300 }) {
  // ...
}
```

### `key` property

Each child in a list should have a unique "`key`" prop. Keys tell Brisa which array item each component corresponds to, so that it can match them up later after the execution of a [`server action`](/building-your-application/data-fetching/server-actions) that does a [`rerenderInAction`](/api-reference/server-apis/rerenderInAction). This becomes important if your array items can move (e.g. due to sorting), get inserted, or get deleted. A well-chosen key helps Brisa infer what exactly has happened, and make the correct updates to the DOM tree after the server action execution.

```tsx
export default function List({ people }) {
  return (
    <ul>
      {people.map((person) => (
        <li key={person.id}>
          <img src={getImageUrl(person)} alt={person.name} />
          <p>
            <b>{person.name}</b>
            {" " + person.profession + " "}
            known for {person.accomplishment}
          </p>
        </li>
      ))}
    </ul>
  );
}
```

The `key` property is also an attribute to identify the instance of a web component. When the value of `key` changes, it forces a unmount + mount of the web component again, resetting the state of the component.

Therefore, from the rendering of a server action executed in a Server Component you can control whether to reset the internal state of a web component (by changing the `key`) or keep it (without changing the `key`).

```tsx
export default function ExampleOfKey({}, { i18n }) {
  // If locale change, some-component is going to be unmounted + mounted
  return <some-component key={i18n.locale} />;
}
```

## Children

In Brisa, the children prop is a special prop that allows components to pass elements, components, or even plain text as children to another component. It provides a flexible way to compose and structure Brisa applications.

The children prop is implicitly available and can be accessed as an argument. Let's take a look at a simple example:

`src/components/my-component.tsx`:

```tsx
const MyComponent = ({ children }) => {
  return (
    <div>
      <p>This is my component</p>
      {children}
    </div>
  );
};

export default MyComponent;
```

`src/components/parent-component.tsx`:

```tsx
const ParentComponent = () => {
  return (
    <MyComponent>
      <p>These are the child components!</p>
    </MyComponent>
  );
};

export default ParentComponent;
```

In this example, the `MyComponent` component can render its content and any child components passed to it using the children prop.

## Events (server actions)

In Brisa Components there is a convention that events must start with `on` prefix. Ex: `onNext`, `onPrev`. After following this convention you can use events in Server Components like browser events, with some differences:

- The browser `event` is serialized
- The code is executed on the server
- It's not adding JS client code

`src/components/password.tsx`:

```tsx
export default function Password({ onValidatePassword }) {
  return (
    <div>
      <input
        type="password"
        onInput={(e) => {
          console.log("this code is executed on the server!");
          // Send data to another server action:
          onValidatePassword(e.target.value);
        }}
        // Debounce the browser event 300ms
        debounceInput={300}
      />
    </div>
  );
}
```

Consuming the `onValidatePassword` server action of this Server Component from another component:

`src/components/example.tsx`:

```tsx
import { navigate } from "brisa";

export default function Example() {
  function validatePassword(password) {
    if (password === "foo") navigate("/bar");
  }

  return <Password onValidatePassword={validatePassword} />;
}
```

> [!NOTE]
>
> For more information about Server Actions, read the [documentation about Server Actions](/building-your-application/data-fetching/server-actions).

## Store (`store` method)

The `store` is a **shared** state among all server-components (possible to transfer some store values on web-components also). The store is a `Map` that lives at request time (inside the request).

### Example:

`src/components/shared-store.tsx`:

```tsx
import type { RequestContext } from "brisa";
import { rerenderInAction } from "brisa/server";

export default function SharedStore({}, { store }: RequestContext) {
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

> [!NOTE]
>
> For more information about `store`, read the [documentation about `RequestContext`](/api-reference/components/request-context#store).

## Context

To share context between Server Components without prop drilling you can use [context](/components-details/context).

To use context take a look to:

- [`createContext`](/components-details/context#create-context-createcontext)
- [`context-provider`](/components-details/context#provider)
- [`useContext`](/components-details/context#consume-context-usecontext)

Example parent:

```tsx
import { createContext } from "brisa";

const ctx = createContext({});

export default function ThemeProvider({ color, children }) {
  <context-provider context={ctx} value={{ color }}>
    {children}
  </context-provider>;
}
```

Example sub-tree child component:

```tsx
export default function SomeChildComponent(props, { useContext }) {
  const theme = useContext(ThemeContext);
  return <div style={{ color: theme.value.color }}>Hello world</div>
```

> [!NOTE]
>
> Learn more about it [here](/building-your-application/components-details/context).

## Template literal `css`

You can write CSS in your components using the template literal named `css`. The return value of `css` is nothing. As it runs, the css is injected during the render.

```tsx
import { RequestContext } from "brisa";

export default function Component(
  { color }: { color: string },
  { css }: RequestContext,
) {
  css`
    .color {
      color: ${color};
    }
  `;

  return <p class="color">{color}</p>;
}
```

> [!NOTE]
>
> You can run this literal template several times and the styles will accumulate.

## Inject HTML (`dangerHTML`)

Make situations that we want to inject HTML that we have in string to the DOM. For these occasions, you can use the [`dangerHTML`](/api-reference/functions/dangerHTML) function. Since without this function it is escaped by security.

```tsx
import { dangerHTML } from "brisa";

export default function SomeComponent() {
  return (
    <>
      {/* Escaped by default (doesn't work for security): */}
      {'<script>alert("This is escaped and is not going to work")</script>'}

      {/* Force to inject an string as HTML: */}
      {dangerHTML(
        '<script>alert("This is injected and is going to work")</script>',
      )}
    </>
  );
}
```

## Suspense component phase

You can generate a [`suspense`](/building-your-application/routing/suspense-and-streaming) phase if your component is **async** and you want to show something while the promise is pending. It also works during HTML streaming.

```tsx
export default async function MyServerComponent({}, { state }) {
  const foo = await fetch(/* ... */).then((r) => r.text());

  return <div>{foo}</div>;
}

MyServerComponent.suspense = (props, reqContext) => <div>loading...</div>;
```

> [!NOTE]
>
> See more details [here](/building-your-application/routing/suspense-and-streaming) to learn more.

## Handle component error

You can generate a [`error`](/building-your-application/routing/custom-error#errors-in-component-level) phase if your server component **throws an error** and you want to show something without crash the rest of the page.

```tsx
import { RequestContext } from "brisa";

export default function SomeComponent() {
  /* some code */
}

SomeComponent.error = ({ error, ...props }, requestContext: RequestContext) => {
  return <p>Oops! {error.message}</p>;
};
```

> [!NOTE]
>
> See more details [here](/building-your-application/routing/custom-error#errors-in-component-level) to learn more.
