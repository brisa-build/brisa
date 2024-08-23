---
description: How to use external libraries in Brisa components
---

# External Libraries

When working on a Brisa project, you may encounter scenarios where you need to integrate external libraries. This documentation outlines the process of installing and using external libraries in different contexts within your project: standalone libraries, server components, and web components.

## Common Installation

For all types of libraries, including standalone, server components, and web components, you can use the `bun install` command to install them. This command fetches and installs the library, making it available for use throughout your project.

```bash
bun install <library-name>
```

## Standalone Libraries

### Import and Usage

Once installed, you can import the library wherever needed in your project and use its functionalities accordingly.

```ts
import myLibrary from "<library-name>";

// Use library functions or classes as needed,
// whether inside web components, server
// components, middleware, etc.
```

This addition emphasizes the versatility of standalone libraries, making it clear that developers can utilize them in various parts of their project, depending on the specific needs of each component type.

## Server Components Dependencies

### Import and Usage

When dealing with server components, import the library and use its functionalities within your server-side code:

```tsx
import ServerComponent from "<server-component-library>";

export default function MyPage() {
  // Use server components as needed inside the JSX
  return <ServerComponent />;
}
```

While both server components and web components can leverage external libraries, the key distinction lies in how they are used. In server components, the integration is more straightforward, as you can directly import and use the libraries within JSX.

### Creating a Server Component Library

To create a server component library, you can use the `brisa build -c component-path.tsx` command. This command generates a new server component library, which you can then publish and install in your project.

```bash
brisa build -c <component-path>
```

> [!NOTE]
>
> See the [CLI documentation](/api-reference/brisa-cli/brisa-build#component-build) for more information on the `brisa build` command.

## Web Components Dependencies

### Import and Usage

To integrate a web component library, create a file named `web-components/_integrations.(tsx|ts|js|jsx)`.

Export an object where each key is the selector of the web component, and the corresponding value is the path (in string format) to the library, similar to what you would use in an import statement.

```ts
import type { WebComponentIntegrations } from "brisa";

export default {
  "custom-element": "<library-path>",
  // Add more mappings as needed
} satisfies WebComponentIntegrations;
```

Usage of web components within server components does not require additional imports. Simply include the web component tags directly in your server component code _(or inside another web component)_:

```tsx
// Inside a server component or inside another web-component
<div>
  <custom-element></custom-element>
</div>
```

This approach allows seamless integration of web components within your server components, maintaining a clean and concise code structure.

> [!TIP]
>
> **Note for Developers:** The web components specified in `web-components/_integrations` will be dynamically included in the client-side code only when they are used on a particular page.

### SSR of external Web Components

Using this declaration:

```ts
import type { WebComponentIntegrations } from "brisa";

export default {
  "custom-element": "<library-path>",
  // Add more mappings as needed
} satisfies WebComponentIntegrations;
```

It **only do SSR** in the case of **Brisa web components without any transpilation**, not in the case of native web components or transpiled Brisa web components.

However, there is a solution. 

Brisa is more than a framework, it is also a [tool to create Web Component libraries](/api-reference/brisa-cli/brisa-build), so all web components created with this Brisa tool can be used in any framework or VanillaJS, and apart, you can use the file with the suffix `.server.js` to do SSR of the web components. So all web components made with Brisa can be imported with this other declaration:

```ts 6
import type { WebComponentIntegrations } from "brisa";

export default {
  "custom-element": {
    client: "<library-path>.client",
    server: "<library-path>.server",
    types: "<library-path>.types",
  },
  // Add more mappings as needed
} satisfies WebComponentIntegrations;
```

> [!TIP]
>
> If your favorite Web Component library is not compatible with SSR, tell them to contact us so they can make it compatible, we want the web to be a better and more accessible place for everyone so we are willing to help any library to be compatible with Brisa.

### TypeScript Types

Using this declaration:

```ts
import type { WebComponentIntegrations } from "brisa";

export default {
  "custom-element": '<library-path>',
  // Add more mappings as needed
} satisfies WebComponentIntegrations;
```

It **only use types** when `<library-path>` is a Brisa Web Component without transpilation and has `.ts` extension. If it is a native web component or a Brisa Web Component with transpilation, you have to create a `.d.ts` file with the types of the web component.

In order to specify the types you need to change the declaration to:

```ts 6
import type { WebComponentIntegrations } from "brisa";

export default {
  "custom-element": {
    client: "<library-path>.client",
    types: "<library-path>.types.d.ts",
  },
  // Add more mappings as needed
} satisfies WebComponentIntegrations;
```

And create a file with the name `<library-path>.types.d.ts` with the types of the web component.

Example of types for a web component:

```ts
export default function CustomCounter({ start }: { start?: number }): JSX.Element;
```

> [!NOTE]
>
> **Note for library creators:** Use an `export default` in the `.d.ts` file to export the types of the web component.

### Creating a Web Component Library

To create a server component library, you can use the `brisa build -w web-component-path.tsx` command. This command generates a new server component library, which you can then publish and install in your project.

```bash
brisa build -w <web-component-path>
```

This is going to create **two files**: `web-component-path.client.js` and `web-component-path.server.js`. The first one is for the client-side, and the second one is for the server-side (SSR with Declarative Shadow DOM).

> [!TIP]
>
> You can use the web component in **any framework or VanillaJS**. See the [CLI documentation](/api-reference/brisa-cli/brisa-build#web-component-build) for more information on the `brisa build` command.

### Third party Brisa web components vs native web components

For both, you can use the `web-components/_integrations.(tsx|ts|js|jsx)`:

```ts
export default {
  "brisa-element": "<library-path>",
  "native-web-component": {
    client: "<library-path>.client",
    server: "<library-path>.server",
    types: "<library-path>.types",
  },
};
```

As a note for those who create open-source libraries, the difference is that if there is a default export, it interprets it as a Brisa web component, so you can create any Brisa library with it:

```tsx
export default function BrisaElement() {
  return <div>My Brisa Element</div>;
}
```

So then, you don't need **any transpilation** and with only this declaration: `"brisa-element": "<library-path>"`, it works for SSR and types. 

However, you can use [transpilation](/api-reference/brisa-cli/brisa-build#web-component-build) to allow the same code to be used in any framework or VanillaJS. Doing this, it's converted to native web components, so then you need to load the `.client.js` file in the client-side and the `.server.js` file in the server-side:

```tsx
"brisa-element": {
  client: "<library-path>.client",
  server: "<library-path>.server",
  types: "<library-path>.types",
},
```

In the case you want to create a native web component, you don't need to export it, and you can use the `customElements.define` method:

```tsx
customElements.define(
  "native-web-component",
  class extends HTMLElement {
    connectedCallback() {
      this.innerHTML = "My Native Web Component";
    }
  },
);
```

> [!IMPORTANT]
>
> **About the definition of the name:** Be careful that the selector name inside `customElements.define` should be the same as the one in the `web-components/_integrations` file.
