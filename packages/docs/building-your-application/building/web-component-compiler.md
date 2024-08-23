# Brisa as Web Component Compiler

Brisa isn't just another framework; it's a powerful tool for developers who need to create highly efficient and portable Web Component libraries. By using Brisa, developers can build standalone web components that work seamlessly across various environments, whether they're integrated into a larger application or used independently. This document focuses on the role of Brisa as a compiler for Web Components, highlighting the value it brings to your development workflow.

Related Topics:

- [Brisa CLI `brisa build`](/api-reference/brisa-cli/brisa-build)
- [External Libraries](/building-your-application/components-details/external-libraries)

## Why Use Brisa for Web Components?

Web Components are a powerful tool for building reusable UI elements that can be easily integrated into any web application, regardless of the framework or environment. However, creating and managing these components can be challenging, especially when considering server-side rendering (SSR), TypeScript support, and compatibility across different platforms. Brisa simplifies this process by providing a robust set of tools and commands that streamline the development and deployment of Web Components.

### Key Benefits of Using Brisa for Web Components

2. **Integration**: Web Components built with Brisa can be used in any framework or vanilla JavaScript, making them highly portable.
3. **SSR Support**: Brisa-generated Web Components are fully compatible with server-side rendering, thanks to its support for Declarative Shadow DOM.
4. **Optimized Performance**: Brisa optimizes Web Components for performance thanks to [signals for reactivity](/building-your-application/components-details/reactivity).
5. **Build optimization**: Brisa compiles Web Components into standalone files doing build-time optimizations to reduce the final bundle size.

## Building Web Components with Brisa

To create a Web Component using Brisa, you can utilize the `brisa build -w` command. This command compiles your Web Component into two distinct files: one for the client-side and one for the server-side. These files are optimized for different environments, ensuring that your Web Component performs well in both contexts.

**Command overview:**

```bash
brisa build -w path/to/your/web-component.tsx
```

- **web-component.client.js**: The client-side JavaScript file for your Web Component, optimized for browser environments.
- **web-component.server.js**: The server-side JavaScript file for your Web Component, used for SSR with Declarative Shadow DOM.

**Example Output**

```sh
[ wait ]  🚀 building your standalone components...
[ info ]   Standalone components:
[ info ]   - build/custom-counter.server.js (646.00 B)
[ info ]   - build/custom-counter.client.js (425.00 B)
[ info ]   ✨  Done in 59.78ms.
```

### Using the Web Component outside Brisa

#### Client-Side Integration

Once built, you can integrate your Web Component into any HTML page or JavaScript application. Here’s an example of how to use these components in a vanilla JavaScript environment:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brisa Web Component Example</title>
  <script type="importmap">
    {
      "imports": {
        "brisa/client": "https://unpkg.com/brisa@latest/client-simplified/index.js"
      }
    }
  </script>
  <script type="module" src="path/to/web-component.client.js"></script>
</head>
<body>
  <custom-counter></custom-counter>
</body>
</html>
```

> [!NOTE]
>
> The import map is necessary outside of the Brisa framework to map `brisa/client` to `brisa/client-simplified`. This is because the Brisa client is internally used by the Brisa framework, and we did a simplified version to be used outside of the framework.

#### Server-Side Rendering

For server-side rendering, Brisa's components integrate smoothly with other JSX frameworks. Here’s how you can render a Brisa Web Component on the server:

```jsx
import { renderToString } from 'brisa/server';
import CustomCounter from './path/to/web-component.server.js';

const html = await renderToString(<CustomCounter start={10} />);
```

If you encounter compatibility issues with the JSX runtime, Brisa offers a jsx function to help resolve these:

```jsx
import { renderToString } from 'brisa/server';
import { jsx } from 'brisa/jsx-runtime';
import CustomCounter from './path/to/web-component.server.js';

const html = await renderToString(jsx(CustomCounter, { start: 10 }));
```

### Using the Web Component in Brisa

To streamline the integration of multiple Web Components, Brisa uses a special integration file located at web-components/`_integrations.(tsx|ts|js|jsx)`. This file maps Web Component selectors to their respective libraries, ensuring they are correctly loaded when needed.

```tsx
import type { WebComponentIntegrations } from "brisa";

export default {
  "custom-counter": {
    client: "./path/to/web-component.client.js",
    server: "./path/to/web-component.server.js",
    types: "./path/to/web-component.types.d.ts",
  },
} satisfies WebComponentIntegrations;
```

> [!NOTE]
>
> After this integration, you can use the Web Component in your Brisa application directly by typing `<custom-counter></custom-counter>` in your JSX code.

#### TypeScript Support

When using Brisa Web Components that require TypeScript types, you can create a `.d.ts` file with the necessary type definitions. This file should be named `<library-path>.types.d.ts` and exported using an `export default` statement.

```ts
export default function CustomCounter({ start }: { start?: number }): JSX.Element;
```

By following these guidelines, you can ensure that your Brisa Web Components are fully typed and compatible with TypeScript.

## Example

You can use this example library to create your own web components with Brisa:

- [Simple Counter as Web Component Example](https://github.com/aralroca/counter-wc)

If you use the Brisa compiler to create your own web components, add this badge:

[![made with Brisa](https://img.shields.io/badge/made_with-Brisa-606ce2)](https://brisa.build)

```md
[![made with Brisa](https://img.shields.io/badge/made_with-Brisa-606ce2)](https://brisa.build)
```

Into your project's README file, let us know, and we will share your library on the Brisa website.