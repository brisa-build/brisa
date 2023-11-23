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

```html
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

### State

TODO

### Context

Web Components do not have access to the [`request context`](/docs/building-your-application/data-fetching/request-context) directly as they are executed on the client. If they need something from the request context, it has to be passed as a parameter.

To share context between Web Components without prop drilling you can use the web context.

TODO: Implement and show an example

### Events

TODO

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
