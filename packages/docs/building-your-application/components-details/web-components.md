---
description: Understand how to use web-components in Brisa.
---

# Web Components

Remember that everything in Brisa (pages, layout, middleware, api...) runs on the server.

The page components are server-components. However, we support a connection to the [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) through the `src/web-components` folder.

Web Components is a suite of different technologies allowing you to create reusable custom elements — with their functionality encapsulated away from the rest of your code — and utilize them in the rest of the app.

Similar to the pages, the file names will be the names of the web components. There is no routing here, but you have to take this into account when adding the names.

```sh
.
└── web-components
    ├── form
    │   └── error-feedback.tsx
    ├── sidebar-menu.tsx
    └── user-card.tsx
```

They can now be used directly as HTML tags in the rest of the web-components and server-components:

```jsx
<body>
  <sidebar-menu />
  <user-card />
  <form>
    <input type="text" />
    <form-error-feedback />
    <button>Submit</button>
  </form>
</body>
```

We support type-safe, so TypeScript can make your life easier when using them.

## Differences with Server Components

In order to make it easy during development, we support the fact that creating web-components is very similar to the rest of the components (Brisa mode). However there are some differences.

Although the server components are interactive in Brisa, the interactivity of the server components is more focused on interactivity where the server is involved. It would not make sense to do the interactivity on the server for Spreadsheet cell components, since all this interactivity could be on the client avoiding constant calls to the server.

Web components are fully reactive thanks to [signals](#state-state-method). There are no rerenders, no virtual DOM and no reconciliation.

And of course, unlike Server Components, you can access the [Web API](https://developer.mozilla.org/en-US/docs/Web/API):

```tsx
import { WebContext } from "brisa";

export default function SomeWebComponent({}, { onMount, cleanup }: WebContext) {
  onMount(() => document.addEventListener("scroll", onScroll));
  cleanup(() => document.removeEventListener("scroll", onScroll));

  function onScroll(event) {
    // some implementation of the scroll event
  }

  return <div>{/* some content */}</div>;
}
```

In the last example, the scroll event is recorded when the web component is mounted and deleted when the web component is unmounted.

## Creating a Web Component

### Step 1: Create the file

Unlike Server Components that can be created anywhere, web components must be inside the `src/web-component` folder. For example, let's create this file: `src/web-component/some-example.tsx`.

Here the **file name** is very important, since it will be the name of the web-component selector. That is, we will be able to use it in other web/server components with the tag:

```tsx
<some-example>Some example</some-example>
```

The names of the Web Components, as a convention, must be created in [**kebab-case**](https://developer.mozilla.org/en-US/docs/Glossary/Kebab_case) and at least 2 batches to avoid conflicts with other elements of the web. However, you can group them in folders.

| Route                                        | Correct | `selector`                 |
| -------------------------------------------- | ------- | -------------------------- |
| `src/web-component/some-example.tsx`         | ✅      | `<some-example/>`          |
| `src/web-component/some/example.tsx`         | ✅      | `<some-example/>`          |
| `src/web-component/some-complex-example.tsx` | ✅      | `<some-complex-example />` |
| `src/web-component/SomeExample.tsx`          | ❌      | -                          |
| `src/web-component/someExample.tsx`          | ❌      | -                          |
| `src/web-component/some_complex-example.tsx` | ❌      | -                          |
| `src/web-component/some_complex/example.tsx` | ❌      | -                          |
| `src/web-component/some.tsx`                 | ❌      | -                          |

### Step 2: Write and `export default` the component

Once we have created the file, we can write our Web Component. The only thing we need to do to make it available is to make a `export default` of the component.

```tsx
export default function HelloWorld() {
  return <div>Hello World</div>;
}
```

## Props

Brisa components use _props_ to communicate with each other. Every parent component can pass some information to its child components by giving them props. Props might remind you of HTML attributes, but you can pass any JavaScript value through them, including objects, arrays, and functions.

The properties are signals but can be used directly without using the `.value`, because they are readonly.

> [!TIP]
>
> **Good to know**: Since props are signals, consume them directly or use [`derived`](#derived-state-and-props-derived-method) method. Doing so breaks the reactivity:
>
> ```tsx
> export default function UserImages({ urls }, { derived }) {
>   // ❌ variable is no longer reactive
>   const firstImage = urls[0];
>   // ✅ Instead, use derived:
>   const reactiveFirstImage = derived(() => urls[0]);
> }
> ```

### Step 1: Pass props to the child component

First, pass some props to `user-images`. For example, let’s pass three props: urls (array of strings), width and height (number):

`src/web-components/user-info.tsx`:

```tsx
export default function UserInfo() {
  return (
    <user-images
      urls={["some-image.jpg", "another-url.jpg"]}
      width={300}
      height={300}
    />
  );
}
```

Now you can read these props inside the `user-images` component.

### Step 2: Read props inside the child component

You can read these props by listing their names `urls`, `width`, `height` separated by the commas inside `({` and `})` directly after `function UserImages`. This lets you use them inside the `UserImages` code, like you would with a variable.

`src/web-components/user-images.tsx`:

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

Adding defaults in this way does not break reactivity.

### `key` property

Each child in a list should have a unique "`key`" prop. Keys tell Brisa which array item each component corresponds to, so that it can match them up later. This becomes important if your array items can move (e.g. due to sorting), get inserted, or get deleted. A well-chosen key helps Brisa infer what exactly has happened, and make the correct updates to the DOM tree.

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

The `key` property is also an attribute to identify the instance of a component. When the value of `key` changes, it forces a unmount + mount of the component again, resetting the state of the component.

For example, if we use the locale as `key`, changing the locale will reset the state of the component.

```tsx
export default function ExampleOfKey({}, { i18n }) {
  // If locale change, some-component is going to be unmounted + mounted
  return <some-component key={i18n.locale} />;
}
```

## Children

In Brisa, the children prop is a special prop that allows components to pass elements, components, or even plain text as children to another component. It provides a flexible way to compose and structure Brisa applications.

The children prop is implicitly available and can be accessed as an argument. Let's take a look at a simple example:

`src/web-components/my-component.tsx`:

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

`src/web-components/parent-component.tsx`:

```tsx
const ParentComponent = () => {
  return (
    <my-component>
      <p>These are the child components!</p>
    </my-component>
  );
};

export default ParentComponent;
```

In this example, the `my-component` component can render its content and any child components passed to it using the children prop.

However, Web-components, by their nature, have the possibility to use the [`slot` tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) also to define children. You can use it in case you need **more than one child**. The prop `children` is an equivalent to an unnamed slot.

This is **also valid**:

`src/web-components/my-component-using-slots.tsx`:

```tsx
const MyComponentUsingSlots = () => {
  return (
    <div>
      <p>This is my component with slots</p>
      <div>
        <slot name="header"></slot>
      </div>
      <div>
        <slot name="content"></slot>
      </div>
    </div>
  );
};

export default MyComponentUsingSlots;
```

`src/web-components/parent-component-using-slots.tsx`:

```tsx
const ParentComponentUsingSlots = () => {
  return (
    <my-component-using-slots>
      <div slot="header">Header Content</div>
      <p slot="content">These are the child components!</p>
    </my-component-using-slots>
  );
};

export default ParentComponentUsingSlots;
```

> [!TIP]
>
> **Good to know**: Slots only work in Web Components. In Server Components only works `children` prop.

## Events

### Events via attributes

In Brisa Components there is a convention that events must start with `on` prefix. Ex: `onNext`, `onPrev`. This convention is because it is necessary to distinguish between attributes that are events and those that are not. And as the functions cannot serialize, we came to make this convention. After following this convention you can use events in Web Components as if you were in other frameworks such as React.

`src/web-components/color-selector.tsx`:

```tsx
import { WebContext } from "brisa";

export default function ColorSelector({ color, onChangeColor }) {
  return (
    <div>
      <input
        type="color"
        value={color}
        onInput={(e) => onChangeColor(e.target.value)}
      />
      <span style={{ color }}>{color}</span>
    </div>
  );
}
```

Consuming the event `onChangeColor` of this Web Component from another component:

`src/web-components/color-circle.tsx`:

```tsx
import { WebContext } from "brisa";

export default function ColorSVG({}: any, { state }: WebContext) {
  const color = state<string>("#ff0000");

  return (
    <>
      <b>Select a color: </b>
      <color-selector
        color={color.value}
        onChangeColor={(newColor: string) => (color.value = newColor)}
      />

      <svg width="12cm" height="12cm" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="6cm"
          cy="2cm"
          r="100"
          fill={color.value}
          transform="translate(0,50)"
        />
      </svg>
    </>
  );
}
```

### DOM events

As web components are DOM elements, they also automatically have their own events. You can capture an `onClick` of any Web Component without the need to implement it inside:

```tsx
<color-selector
  color={color.value}
  onClick={(e) => console.log("onClick event already work? 🤯", e)}
  onChangeColor={(newColor: string) => (color.value = newColor)}
/>
```

> [!TIP]
>
> **Good to know**: It is important to know this when naming events that do not conflict with [existing DOM events](https://www.w3schools.com/jsref/dom_obj_event.asp), to avoid "event fires twice" issues. Also important if you want to overwrite a DOM event, use the [`e.stopPropagation()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation) to avoid the conflict.

### Events on `ref`

You can register an event after accessing an element with the `ref` attribute and `state`:

```tsx
export default ({}, { onMount, cleanup, state }: WebContext) => {
  const ref = state(null);

  function onClick(e) {
    console.log("Event via ref", e);
  }

  onMount(() => ref.value.addEventListener("click", onClick));
  cleanup(() => ref.value.removeEventListener("click", onClick));

  return <div ref={ref}>Example</div>;
};
```

Although we recommend registering events via attributes, we also provide the opportunity to do it this way. The grace of the `ref` is also that you can have control of the element after mounting, thing that also allows to register events in it.

> [!TIP]
>
> **Good to know**: For the `ref` attribute you do not have to put the `.value`, you have to put the whole state.

## State (`state` method)

The state is under a signal. This means that to consume it you have to use the `.value` clause.

### Example:

`src/web-components/counter-component.tsx`:

```tsx
import { WebContext } from "brisa";

export default function Counter({}, { state }: WebContext) {
  // Declaring state
  const count = state<number>(0);

  // Setting state:
  const inc = () => count.value++;
  const dec = () => count.value--;

  return (
    <>
      <button onClick={inc}>+</button>
      {/* Consuming state: */}
      <span> Counter: {count.value} </span>
      <button onClick={dec}>-</button>
    </>
  );
}
```

Whenever a state mutate (change the `.value`) reactively updates these parts of the DOM where the signal has been set.

## Store (`store` method)

The difference between state and `store` is that store is a **shared** state among all web-components. The store is a reactive `Map`, where the methods `get`, `has`, `set` and `delete` are reactive.

There is no need to use the `.value` here. But once the `.get` is done you may lose reactivity and need to add it to a `derived`.

### Example:

`src/web-components/shared-store.tsx`:

```tsx
import { WebContext } from "brisa";

export default function SharedStore({}, { store }: WebContext) {
  // Setting store
  store.set("user", { username: "foo", displayName: "Foo" });

  function updateName() {
    // Reactive update all web-components that consume the same store entry
    store.set("user", { username: "bar", displayName: "Bar" });
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

### Example with `derived` and `store`:

```tsx
import { WebContext } from "brisa";

export default function SharedStore({}, { store, derived }: WebContext) {
  const name = derived(() => store.get("user").displayName);

  // Setting store
  store.set("user", { username: "foo", displayName: "Foo" });

  function updateName() {
    // Reactive update all web-components that consume the same store entry
    store.set("user", { username: "bar", displayName: "Bar" });
  }

  // Consuming derived store
  return (
    <>
      Hello {name.value}
      <button onClick={updateName}>Update name</button>
    </>
  );
}
```

## Effects (`effect` method)

Effects are used to record side effects such as fetching data, setting up a subscription, and manually changing the DOM in Brisa components.

Each effect is executed immediately upon registration and also every time a registered signal within the effect changes. There is no need to write the dependencies of these signals separately, since the effect is smart enough to detect the signals.

```tsx
export default ({ foo }: { foo: string }, { effect }: WebContext) => {
  effect(() => {
    if (foo === "bar") {
      console.log("foo now is bar");
    }
  });

  return <div>Example</div>;
};
```

This would be an example using a prop called `foo`. The props are signals readonly, that's why it doesn't have the `.value`.

You can also use async-await in effects:

```tsx
export default ({ foo }: { foo: string }, { state, effect }: WebContext) => {
  const bar = state<any>();

  effect(async () => {
    if (foo === "bar") {
      bar.value = await fetch(/* some endpoint */).then((r) => r.json());
    }
  });

  return bar.value && <div>{bar.value.someField}</div>;
};
```

## Effect on mount (`onMount` method)

The `onMount` method is triggered only once, when the component has been mounted. In the case that the component is unmounted and mounted again, it will be called again, although it would be another instance of the component starting with its initial state.

It is useful for using things during the life of the component, for example document events, or for accessing rendered DOM elements and having control over them.

To delete the events recorded during this lifetime, there is the following [`cleanup`](#clean-effects-cleanup-method) method.

```tsx
import { WebContext } from "brisa";

export default function SomeWebComponent({}, { onMount, cleanup }: WebContext) {
  onMount(() => {
    // Register things after mounting the component
    document.addEventListener("scroll", onScroll);
  });
  cleanup(() => {
    // Unregister when the component unmounts
    document.removeEventListener("scroll", onScroll);
  });

  function onScroll(event) {
    // some implementation of the scroll event
  }

  return <div>{/* some content */}</div>;
}
```

## Clean effects (`cleanup` method)

As discussed above in the [`onMount`](#effect-on-mount-onmount-method) method, there is also a cleanup method to clean up the unmount. However, it has more power than just this.

The `cleanup` will be triggered when:

- When the component is **unmounted**, it calls up all `cleanup` used in the component.
- If you have a cleanup inside an [**`effect`**](#effects-effect-method), every time the `effect` is executed **before it is executed**, the `cleanup`s inside it will be called.

```tsx
import { WebContext } from "brisa";

export default function SomeWebComponent({ foo }, { effect, cleanup }: WebContext) {
  effect(() => {
    const interval = setInterval(() => console.log(foo), 100)

    // - Triggered before each effect execution (when "foo" change)
    // - Triggered also on unmount
    cleanup(() => clearInterval(interval)) //
  });

  cleanup(() => /* Triggered on unmount */);

  return <div>{/* some content */}</div>;
}
```

## Derived state and props (`derived` method)

The `derived` method is useful to create signals derived from other signals such as state or props.

Example derived from props:

`src/web-components/my-component.tsx`:

```tsx
export default function MyComponent({ user }, { derived }) {
  const username = derived(() => user.name ?? "No user");

  return <div>{username.value}</div>;
}
```

Example derived from state:

`src/web-components/double-counter.tsx`:

```tsx
export default function DoubleCounter({}, { state, derived }) {
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

## Context

To share context between Web Components without prop drilling you can use [context](/components-details/context).

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

You can write CSS in your web components using the template literal named `css`. The return value of `css` is nothing. As it runs, the css is generated in the web component and the signals are registered to update it.

```tsx
import { WebContext } from "brisa";

export default function WebComponent(
  { color }: { color: string },
  { css }: WebContext,
) {
  css`
    p {
      color: ${color};
    }
  `;

  return <p>{color}</p>;
}
```

You can use the name of the elements directly as the web components by their nature encapsulate the styles and there is no conflict with other web components. In this example, whenever the `color` property changes, it shall be updated reactively.

Useful for creating animations, keyframes, pseudo classes or other things that can't be done with the style property and have more control of the css and signals.

If you use VSCode we recommend [this extension](https://marketplace.visualstudio.com/items?itemName=styled-components.vscode-styled-components) to improve DX.

> [!NOTE]
>
> You can run this literal template several times and the styles will accumulate.

> [!CAUTION]
>
> This function must be executed before the first render, don't put it inside an `effect`, event or `onMount`.

## Custom hooks

To use [`effect`](#effects-effect-method), [`cleanup`](#clean-effects-cleanup-method), [`state`](#state-state-method), [`store`](#store-store-method), [`derived`](#derived-state-and-props-derived-method), [`useContext`](#context) and [`onMount`](#effect-on-mount-onmount-method) functions outside the component it is necessary to create a **custom hook**. This hook should be used before the JSX, not inside.

Unlike other frameworks, in Brisa it is necessary to propagate the [`WebContext`](/api-reference/components/web-context), since each web component has a different one and self-manages its own life.

Example defining a custom hook:

```tsx
import { WebContext } from "brisa";

export default function useRandomColorInterval({
  state,
  effect,
  cleanup,
}: WebContext) {
  const getRandomColor = () =>
    "#" + Math.floor(Math.random() * 16777215).toString(16);

  const color = state(getRandomColor());

  effect(() => {
    let interval = setInterval(() => {
      color.value = getRandomColor();
    }, 1000);

    cleanup(() => {
      clearInterval(interval);
    });
  });

  return color;
}
```

How to consume it:

```tsx
import { WebContext } from "brisa";
import useRandomColorInterval from "@/web-hooks/use-random-color-interval";

export default function ThemeProvider(
  { color }: Theme,
  webContext: WebContext,
) {
  const randomColor = useRandomColorInterval(webContext);

  return <div style={{ color: randomColor.value }}>{randomColor.value}</div>;
}
```

How **NOT** to consume it:

```tsx
import { WebContext } from "brisa";
import useRandomColorInterval from "@/web-hooks/use-random-color-interval";

export default function ThemeProvider(
  { color }: Theme,
  webContext: WebContext,
) {
  // ❌ BAD
  return <div>{useRandomColorInterval(webContext).value}</div>;
}
```

> [!CAUTION]
>
> Avoid having all hooks (server and client) in the same file. There are no `"use client"`, `"use server"` directives here, so it is important to check with the type-safe whether it is WebContext or RequestContext that the custom hook expects.

## Portals (`createPortal`)

[`createPortal`](/api-reference/functions/createPortal) lets you render some children into a different part of the DOM. `createPortal(children, domNode)`.

To create a portal, call `createPortal`, passing some JSX, and the DOM node where it should be rendered:

```tsx
import { createPortal } from "brisa";

export default function Component() {
  return (
    <div>
      <p>This child is placed in the parent div.</p>
      {createPortal(
        <p>This child is placed in the document body.</p>,
        document.body,
      )}
    </div>
  );
}
```

A portal only changes the physical placement of the DOM node. In every other way, the JSX you render into a portal acts as a child node of the Brisa component that renders it. For example, the child can access the context provided by the parent tree, and events bubble up from children to parents according to the Brisa tree.

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

You can generate a [`suspense`](/building-your-application/routing/suspense-and-streaming#suspense-in-web-components) phase if your web-component is **async** and you want to show something while the promise is pending. It also works during HTML streaming.

```tsx
export default async function MyWebComponent({}, { state }) {
  const foo = await fetch(/* ... */).then((r) => r.text());

  return <div>{foo}</div>;
}

MyWebComponent.suspense = (props, webContext) => <div>loading...</div>;
```

> [!NOTE]
>
> See more details [here](/building-your-application/routing/suspense-and-streaming#suspense-in-web-components) to learn more.

## Handle component error

You can generate a [`error`](/building-your-application/routing/custom-error#errors-in-component-level) phase if your web-component **throws an error** and you want to show something without crash the rest of the page.

```tsx
import { WebContext } from "brisa";

export default function SomeWebComponent() {
  /* some code */
}

SomeWebComponent.error = ({ error, ...props }, webContext: WebContext) => {
  return <p>Oops! {error.message}</p>;
};
```

> [!NOTE]
>
> See more details [here](/building-your-application/routing/custom-error#errors-in-component-level) to learn more.

## Using Web Components in Web Components

Within the web components you can use other web components by writing them as if they were other DOM elements. We are not going to use any import, we can consume it directly as another HTML tag.

Example consuming a Web Component inside a Web Component:

```tsx filename="src/web-components/using-web-component.tsx" switcher
import { WebContext } from "brisa";

type Props = { name: string };

export function ServerComponent(
  { name, children }: Props,
  webContext: WebContext,
) {
  return (
    <div>
      {/* This is the Web Component, no import need it, is like more HTML tags */}
      <some-web-component name={name}>{children}</some-web-component>
    </div>
  );
}
```

```js filename="src/web-components/using-web-component.js" switcher
import { WebContext } from "brisa";

export function ServerComponent({ name, children }, webContext) {
  return (
    <div>
      {/* This is the Web Component, no import need it, is like more HTML tags */}
      <some-web-component name={name}>{children}</some-web-component>
    </div>
  );
}
```

## Using Web Components in Server Components

We are not going to use any import, we can consume it directly as another HTML tag.

Example consuming a Web Component inside a Server Component:

```tsx filename="src/components/using-web-component.tsx" switcher
import { RequestContext } from "brisa";
import AnotherServerComponent from "./another";

type Props = { name: string };

export function ServerComponent(
  { name }: Props,
  requestContext: RequestContext,
) {
  return (
    <div>
      {/* This is the Web Component, no import need it, is like more HTML tags */}
      <some-web-component name={name}>
        <AnotherServerComponent name={name} />
      </some-web-component>
    </div>
  );
}
```

```js filename="src/components/using-web-component.js" switcher
import AnotherServerComponent from "./another";

export function ServerComponent({ name }, requestContext) {
  return (
    <div>
      {/* This is the Web Component, no import need it, is like more HTML tags */}
      <some-web-component name={name}>
        <AnotherServerComponent name={name} />
      </some-web-component>
    </div>
  );
}
```

## Using Server Components in Web Components

It is not possible to use Server Components inside Web Components **directly** (with an import). However, it **is possible** to add Server Components within Web Components. But it can only be done through the prop [**children**](#children) or using [**slots**](#children).

Web component:

`src/web-components/my-counter.tsx`:

```tsx
const LIMIT = 100;

export default function MyCounter({ children, onLimit }, { state, effect }) {
  const count = state(0);

  effect(() => {
    if (count.value === LIMIT) {
      console.log("Log from client");
      onLimit();
    }
  });

  return (
    <div>
      <button onClick={() => count.value--}>-</button>
      <button onClick={() => count.value++}>+</button>
      {count.value}
      {/* This children can be a Server Component: */}
      <div>{children}</div>
    </div>
  );
}
```

Server Component:

```tsx
import AnotherServerComponent from "./another";

export default function MyServerComponent() {
  return (
    <my-counter onLimit={() => console.log("Log from server")}>
      <AnotherServerComponent />
    </my-counter>
  );
}
```

## Server Side Rendering

By default Brisa applies **Server Side Rendering (SSR)** of the web components, this means that they are executed both on the **server** and then on the **client** during hydration. To do this we use the [Declarative Shadow DOM](https://developer.chrome.com/docs/css-ui/declarative-shadow-dom) below.

Within the Web Component the only ones that do **not run on the server** are:

- [`effect`](#effects-effect-method) - Effects such as side-effects that can be used to interact with the Web API are not executed during the SSR.
- [`onMount`](#effect-on-mount-onmount-method) - The components are mounted on the client once the browser receives the HTML (even if it does not have JavaScript), so it does not make sense to run this function on the server. When the component is hydrated on the client then this function is executed, only once, on the client.
- [`cleanup`](#clean-effects-cleanup-method) - Similar to `onMount`, if they are not mounted on the server, they are not unmounted on the server either. All cleanup functions are only executed on the client.
- [**Events**](#events) - Since the events are executed after a user (client) action, they are not executed during the SSR.

### How to disable SSR to a web component

There are cases where we can avoid the SSR of some web component. It makes sense for these web components that are not available in the initial rendered page, for example they appear after some web interaction, such as a modal.

To do this, all web components have available the `skipSSR` attribute. It's `true` by default _(this attribute does not need to be used when it is `true`)_, but you can use it to turn to `false`. This can be used in any web-component, either consumed from another web-component or from a server component.

```tsx
<some-web-component skipSSR />
```

## Reusing Elements without [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)

In Brisa, incorporating components using the syntax `<Component />` within a web component is **not feasible**. This invocation method is exclusive to server components. Brisa follows this approach to maintain a clear separation of concerns, where client components solely contain client code, and server components house server code, along with the markup of the `web-components` and other elements like a `div`.

- `<Component />` - Smart/dummy server component.
- `<web-component />` - Smart web component element. Dummy versions can be created, but it's advisable to leverage server components to avoid client-side JavaScript or use markup generators inside.
- `{markupGenerator()}` - Generates dummy markup within web-server components.

Efforts have been invested in facilitating communication between these two realms, ensuring a seamless integration without confusion from intermingling code.

Concepts:

- Smart: Possesses an internal state.
- Dummy: Can utilize external state, but lacks a state created and housed internally.

This distinctive approach distinguishes Brisa from other frameworks in reusing web component code without necessitating the creation of [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM).

In frameworks like React, to reuse markup (HTML elements), dummy components must be created—components without state. However, in Brisa, it is recommended to employ **markup generators** (functions) and invoke them during rendering.

```tsx filename="src/web-components/_partials/generate-percentage.tsx" switcher
import { type Signal } from "brisa";

export function generatePercentage(percentage: Signal<number>) {
  return (
    <span>
      Percentage:{" "}
      {percentage.value > 0 ? `+${percentage.value}` : percentage.value}%
    </span>
  );
}
```

Subsequently, these markup generators can be directly invoked within JSX:

```tsx filename="src/web-components/counter.tsx" switcher
import { type WebContext } from "brisa";
import generatePercentage from "./_partials/generate-percentage";

export default function Counter({}, { state }: WebContext) {
  const count = state(0);

  return (
    <div>
      <button onClick={() => count.value++}>+</button>
      {generatePercentage(count)}
      <button onClick={() => count.value--}>-</button>
    </div>
  );
}
```

Markup generators execute only when the web component is mounted, and the content returned by the generator becomes reactive. However, an exception exists when the argument holds the value of a signal rather than the full signal.

Do this:

```tsx
// ✅ Good: The content of the markup generator
// will be reactive as it consumes the signal. It
// won't execute generatePercentage again.
<div>{generatePercentage(count)}</div>
```

Avoid this:

```tsx
// ❌ Bad: It will be reactive, but the
// generatePercentage markup generator will be
// executed again because the content only
// has the signal value and not the full signal.
<div>{generatePercentage(count.value)}</div>
```

Unlike web components, markup generators lack their own state.

Choosing between a **web component** and a **markup generator** depends on the need:

- Use a **web component** if encapsulating logic in a state is required.
- Use a **markup generator** if generating HTML for reuse in web components without internal state is sufficient.

> [!NOTE]
>
> Performance concerns are alleviated in Brisa, as there are no rerenders, and markup generators execute only once.

> [!TIP]
>
> You have the flexibility to establish directories or files with the \_ prefix, steering clear of the need to create web components within the `src/web-components` directory. This proves beneficial when incorporating reusable markup generators within web components. The sole exceptions to this practice are `_native`, a dedicated directory specifically designed for crafting native web components, free from both Brisa and JSX influences, and `_integrations.tsx`, an additional file exempt from this convention.

> [!CAUTION]
>
> Avoid sending the [`WebContext`](/api-reference/components/web-context) or parts of them to the markup generators, you can send signals ([props](#props), [state](#state-state-method), [derived](#derived-state-and-props-derived-method), [`context`](#context) and [store](#store-store-method) signals) and static values without issues.

## UI-agnostic

By default the web components are from Brisa, this makes it easy to have access to many features such as signals and optimizations so that they take up very little bundle size.

However, in the end it translates to web components, if you want you can transform the web components from other frameworks such as React, Vue, Svelte, Lit or use native web components.

We know that Brisa is very new, and the community behind it is growing, but it is still small compared to other frameworks. We believe it is important that you can use native web components to reuse many existing libraries, such as [material components](https://github.com/material-components/material-web).

### Native web components

All native web components can be located inside `web-components/_native` and consumed in your components.

Example:

:::tabs key:language
==web-components/\_native/some-native.ts

```tsx
export default class SomeNative extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = "<h2>NATIVE WEB COMPONENT</h2>";
  }
}
```

:::

Then you can consume it with `<some-native />` depending the filename.

> [!TIP]
>
> In build-time is taken into account to import to your pages only the web components that the page is consuming, if it is not consumed, it will not be imported.

### Components from React, Vue, Svelte...

We do not directly support a transformation of every component from another library to web components, but there are many alternatives that you can use:

- [React to web components](https://github.com/bitovi/react-to-web-component)
- [Preact to web components](https://github.com/bitovi/react-to-web-component)
- [Vue to web components](https://vuejs.org/guide/extras/web-components.html#definecustomelement)
- [Svelte to web components](https://svelte.dev/docs/custom-elements-api)

> [!TIP]
>
> The transformation of UI components to custom elements should be the responsibility of each framework, Vue and Svelte currently support it in their core.
