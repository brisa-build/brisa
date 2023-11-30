---
title: Web Components
description: Understand how to use web-components in Brisa.
---

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

## Differences with server components

In order to make it easy during development, we support the fact that creating web-components is very similar to the rest of the components (Brisa mode). However there are some differences.

Web components are fully reactive thanks to signals. There are no rerenders, no virtual DOM and no reconciliation.

### State

The state is under a signal. This means that to consume it you have to use the `.value` clause.

#### Example:

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

### Events

#### Events via attributes

In Brisa Web Components there is a convention that events must start with `on` prefix. Ex: `onNext`, `onPrev`. This convention is because it is necessary to distinguish between attributes that are events and those that are not. And as the functions cannot serialize, we came to make this convention. After following this convention you can use events in Web Components as if you were in other frameworks such as React.

`src/web-components/color-selector.tsx`:

```tsx
import { WebContext } from "brisa";

export default function ColorSelector({ color, onChangeColor }: WebContext) {
  return (
    <div>
      <input
        type="color"
        value={color}
        onInput={(e: any) => onChangeColor(e.target.value)}
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

#### DOM events

As web components are DOM elements, they also automatically have their own events. You can capture an `onClick` of any Web Component without the need to implement it inside:

```tsx
<color-selector
  color={color.value}
  onClick={(e) => console.log("onClick event already work? 🤯", e)}
  onChangeColor={(newColor: string) => (color.value = newColor)}
/>
```

> **Good to know**: It is important to know this when naming events that do not conflict with [existing DOM events](https://www.w3schools.com/jsref/dom_obj_event.asp), to avoid "event fires twice" issues. Also important if you want to overwrite a DOM event, use the [`e.stopPropagation()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation) to avoid the conflict.

#### Events on `ref`

You can register an event after accessing an element with the `ref` attribute and `state`:

```tsx
export default ({}, { onMount, cleanup, state }: any) => {
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

> **Good to know**: For the `ref` attribute you do not have to put the `.value`, you have to put the whole state.

### Effect

### onMount

### Cleanup

### Derived

### Context

Web Components do not have access to the [`request context`](/docs/building-your-application/data-fetching/request-context) directly as they are executed on the client. If they need something from the request context, it has to be passed as a parameter.

To share context between Web Components without prop drilling you can use the web context.

TODO: Implement and show an example

## Creating a Web Component

TODO

## Using Web Components in Web Components

TODO

## Using Web Components in Server Components

We are not going to use any import, we can consume it directly as another HTML tag.

Example consuming a Web Component inside a Server Component:

```tsx filename="src/components/using-web-component.tsx" switcher
import { RequestContext } from "brisa";
import AnotherServerComponent from "./another";

type Props = { name: string };

export function ServerComponent(
  { name }: Props,
  requestContext: RequestContext
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

TODO

## UI-agnostic

If instead of using the Brisa mode you want to transform React, Vue, Svelte, Solid, Lit components, you can do it easily. Or even if you want to use native Web Components.

### Brisa

TODO

### React

TODO

### Vue.js

TODO

### Svelte

TODO

### Solid

TODO

### Lit

TODO

### Native

TODO
