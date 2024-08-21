---
description: The Brisa CLI to build.
---

# Building (`brisa build`)

`brisa build` creates an optimized production build of your application. The output displays information about each route:

```sh
[ info ]   Route                           | JS server | JS client (gz)
[ info ]   ---------------------------------------------------------------
[ info ]   λ /pages/index                  | 41 kB     | 12 kB
[ info ]   λ /pages/about-us               | 1 kB      | 7 kB 
[ info ]   λ /pages/user/[username]        | 244 B     | 2 kB 
[ info ]   λ /api/user/[username]          | 105 B     |               
[ info ]   ƒ /middleware                   | 401 B     |               
[ info ]   Δ /layout/index                 | 759 B     |               
[ info ]   Ω /i18n                         | 737 B     |               
[ info ]   Ψ /websocket                    | 8 B       |               
[ info ]   Θ /web-components/_integrations | 528 B     |               
[ info ]  
[ info ]   λ  Server entry-points
[ info ]   Δ  Layout
[ info ]   ƒ  Middleware
[ info ]   Ω  i18n
[ info ]   Ψ  Websocket
[ info ]   Θ  Web components integrations
[ info ]        - client code already included in each page
[ info ]        - server code is used for SSR
[ info ]  
[ info ]   Φ  JS shared by all
[ info ]  
[ info ]   ✓   Compiled successfully!
[ info ]   ✨  Done in 253.72ms.
```

- **JS server**: The number of bytes of JavaScript code that will be executed on the server.
- **JS client (gz)**: The number of bytes of JavaScript code that will be sent to the client, after being compressed with gzip.

Only the JS client code is [compressed with gzip](https://en.wikipedia.org/wiki/Gzip). The JS server code size is without compression.

To get a list of the available options with `brisa build`, run the following command inside your project directory:

```sh
brisa build --help
```

The output should look like this:

```sh
Usage: brisa build [options]
Options:
 -d, --dev           Build for development (useful for custom server)
 -w, --web-component Build standalone web component to create a library
 -c, --component     Build standalone server component to create a library
 -s, --skip-tauri    Skip open tauri app when 'output': 'desktop' | 'android' | 'ios' in brisa.config.ts
 --help              Show help
```

## Build different outputs

If you want to build your application for [different outputs](/building-your-application/building/#app-strategy-static-server-desktop-android-ios), you can use the [`output`](/building-your-application/configuring/output) field in the `brisa.config.ts` file. The available outputs are:

- [**server**](/building-your-application/building/web-service-app): The default output. It generates a server-side application.
- [**static**](/building-your-application/building/static-site-app): Generates a static application.
- [**desktop**](/building-your-application/building/desktop-app): Generates a desktop application.
- [**android**](/building-your-application/building/android-app): Generates an Android application.
- [**ios**](/building-your-application/building/ios-app): Generates an iOS application.

If you want to make a desktop app for Windows, another one for Mac, also android and ios, all at the same time. We recommend you do this in an array inside a pipeline and use an environment variable to decide the output. 

The good thing is that if you are on Windows, it will use the native Windows stuff for the Destkop app build, the same with Linux and Mac.

## Development build

`brisa build -d` creates a development build of your application. This build is useful for custom servers.

## Web component build

`brisa build -w path/web-component.tsx` creates a standalone web component to create a library. The path to the file can be relative or absolute. The output will be:

> [!IMPORTANT]
>
> The name of the web component is going to be the name of the file. For example, if your file is 
`custom-counter.tsx`, the name of the web component will be `custom-counter`.

The output will be:

```sh
[ info ]   Web component created successfully!
[ info ]
[ info ]   Standalone components:
[ info ]   - custom-counter.client.js (2 kB)
[ info ]   - custom-counter.server.ts (2 kB)
[ info ]
[ info ]   ✨  Done in 153.72ms.
```

In the case that you need to build more than one web component, you can use the `--web-component` flag multiple times:

```sh
brisa build -w path/web-component1.tsx -w path/web-component2.tsx
```

After running the command, you will have a `web-component1.client.js`, `web-component1.server.ts`, `web-component2.client.js`, and `web-component2.server.ts` file.

```sh
[ info ]   Web component created successfully!
[ info ]
[ info ]   Standalone components:
[ info ]   - web-component1.client.js (2 kB)
[ info ]   - web-component1.server.ts (2 kB)
[ info ]   - web-component2.client.js (2 kB)
[ info ]   - web-component2.server.ts (2 kB)
[ info ]
[ info ]   ✨  Done in 153.72ms.
```

**Why theses files?**

- ***.client.js**: The client-side code of the web component.
- ***.server.ts**: The server-side code of the web component, used for SSR.

### Client-side code usage

Example using these web components in Vanilla JavaScript:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Example</title>
   <script type="importmap">
    {
      "imports": {
        "brisa/client": "https://unpkg.com/brisa@latest/client-simplified/index.js"
      }
    }
  </script>
  <script type="module" src="web-component1.client.js"></script>
  <script type="module" src="web-component2.client.js"></script>
</head>
<body>
  <web-component1></web-component1>
  <web-component2></web-component2>
</body>
</html>
```

> [!NOTE]
>
> The import map is necessary outside of the Brisa framework to map `brisa/client` to **`brisa/client-simplified`**. This is because the Brisa client is internally used by the Brisa framework and we did a simplified version to be used outside of the framework.

### SSR of Web Component

Example server-side rendering these web components in a different JSX framework:

```tsx
import { rerenderToString } from 'brisa/server';
import WebComponent1 from './web-component1.server.ts';
import WebComponent2 from './web-component1.server.ts';

const htmlWC1 = rerenderToString(<WebComponent1 foo="bar" />);
const htmlWC2 = rerenderToString(<WebComponent2 foo="bar" />);
```

In the case of incompatibilties with the jsx-runtime, you can use the `jsx` function:

```tsx
import { rerenderToString } from 'brisa/server';
import { jsx } from 'brisa/jsx-runtime';
import WebComponent1 from './web-component1.server.ts';
import WebComponent2 from './web-component1.server.ts';

const htmlWC1 = rerenderToString(jsx(WebComponent1, { foo: "bar" }));
const htmlWC2 = rerenderToString(jsx(WebComponent2, { foo: "bar" }));
```

> [!NOTE]
>
> The Web Components during SSR are transformed into [Declarative Shadow DOM](https://web.dev/articles/declarative-shadow-dom).

TODO: Verify that the examples work.

## Component build

`brisa build -c path/component.ts` creates a standalone server component to create a library. The path to the file can be relative or absolute. The output will be:

```sh
[ info ]   Server component created successfully!
[ info ]
[ info ]   Files:
[ info ]   - component.server.ts (2 kB)
[ info ]
[ info ]   ✨  Done in 153.72ms.
```

In the case that you need to build more than one component, you can use the `--component` flag multiple times:

```sh
brisa build -c path/component1.ts -c path/component2.ts
```

After running the command, you will have a `component1.server.ts` and a `component2.server.ts` file.

```sh
[ info ]   Server component created successfully!
[ info ]
[ info ]   Files:
[ info ]   - component1.server.ts (2 kB)
[ info ]   - component2.server.ts (2 kB)
[ info ]
[ info ]   ✨  Done in 153.72ms.
```

### How to use the server component

Example using this server component in a different framework:

```tsx
import { rerenderToString } from 'brisa/server';
import { Component } from 'path/component.server.ts';

const html = rerenderToString(<Component foo="bar" />);
```

In the case of incompatibilties with the jsx-runtime, you can use the `jsx` function:

```tsx
import { rerenderToString } from 'brisa/server';
import { jsx } from 'brisa/jsx-runtime';

const html = rerenderToString(jsx(Component, { foo: 'bar' }));
```

## Skip open Tauri app

When the `output` is set to `desktop`, `ios`, or `android` in `brisa.config.ts`, the build is done twice:

1. The first build is for the statics files.
2. The second build is for the desktop, ios, or android app (Integration with Tauri).

`brisa build -s` skips the integration with Tauri and only builds the static files.

> [!NOTE]
>
> Learn more about the app strategy (`server`, `static`, `desktop`, `android`, `ios`) [here](/building-your-application/building/#app-strategy-static-server-desktop-android-ios).

