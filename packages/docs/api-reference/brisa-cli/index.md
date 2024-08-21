---
description: The Brisa CLI allows you to develop, build, start your application, and more.
---

# Brisa CLI

The Brisa CLI allows you to develop, build, start your application, and more.

To get a list of the available CLI commands, run the following command inside your project directory:

```sh
brisa --help
```

The output should look like this:

```sh
Usage: brisa [options] <command>
Options:
 --help        Show help
Commands:
 dev           Start development server
 build         Build for production
 start         Start production server
 ```

## Development

`brisa dev` starts the application in development mode with hot-code reloading, error reporting, and more.

To get a list of the available options with `brisa dev`, run the following command inside your project directory:

```sh
brisa dev --help
```

The output should look like this:

```sh
Usage: brisa dev [options]
Options:
 -p, --port         Specify port
 -d, --debug        Enable debug mode
 -s, --skip-tauri   Skip open tauri app when 'output': 'desktop' | 'android' | 'ios' in brisa.config.ts
 --help             Show help
```

### Changing the port

The application will start at `http://localhost:3000` by default. The default port can be changed with `-p`, like so:

```sh
brisa dev -p 8080
```

### Debug mode

`brisa dev -d` enables debug mode. 

> [!NOTE]
>
> See more about [debug ging documentation](/building-your-application/configuring/debugging).

### Skip tauri

`brisa dev -s` skips opening the desktop app when `output` is set to `desktop`, `ios`, or `android` in `brisa.config.ts`.

> [!NOTE]
>
> Learn more about the app strategy (`server`, `static`, `desktop`, `android`, `ios`) [here](/building-your-application/building/#app-strategy-static-server-desktop-android-ios).

## Building

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
 -s, --skip-tauri    Skip open tauri app when 'output': 'desktop' | 'android' | 'ios' in brisa.config.ts
 -d, --dev           Build for development (useful for custom server)
 -w, --web-component Build standalone web component to create a library
 -c, --component     Build standalone server component to create a library
 --help              Show help
```

### Development build

`brisa build -d` creates a development build of your application. This build is useful for custom servers.

### Web component build

`brisa build -w path/web-component.tsx` creates a standalone web component to create a library. The path to the file can be relative or absolute. The output will be:

> [!IMPORTANT]
>
> The name of the web component is going to be the name of the file. For example, if your file is 
`custom-counter.tsx`, the name of the web component will be `custom-counter`.
