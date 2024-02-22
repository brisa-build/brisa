---
title: External libraries
description: How to use external libraries in Brisa components
---

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

// Use library functions or classes as needed, whether inside web components, server components, middleware, etc.
```

This addition emphasizes the versatility of standalone libraries, making it clear that developers can utilize them in various parts of their project, depending on the specific needs of each component type.

## Server Components

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

## Web Components

### Import and Usage

To integrate a web component library, create a file named `web-components/_integrations.(tsx|ts|js|jsx)`.

Export an object where each key is the selector of the web component, and the corresponding value is the path (in string format) to the library, similar to what you would use in an import statement.

```ts
export default {
  "custom-element": "<library-path>",
  // Add more mappings as needed
};
```

Usage of web components within server components does not require additional imports. Simply include the web component tags directly in your server component code:

```tsx
// Inside a server component or inside another web-component
<div>
  <custom-element></custom-element>
</div>
```

This approach allows seamless integration of web components within your server components, maintaining a clean and concise code structure.

> [!NOTE]
> This dynamic loading approach allows seamless integration of web components within your server components, optimizing the performance by loading only the necessary libraries when they are required.

**Note for Developers:** The web components specified in `web-components/_integrations` will be dynamically included in the client-side code only when they are used on a particular page. This behavior ensures optimal loading, preventing unnecessary libraries from being carried until they are explicitly required by the page.
