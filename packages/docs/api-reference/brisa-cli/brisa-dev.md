---
description: The Brisa CLI to develop.
---

# Development (`brisa dev`)

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

## Changing the port

The application will start at `http://localhost:3000` by default. The default port can be changed via `process.env.PORT` or with `-p` flag, like so:

```sh
brisa dev -p 8080
```

## Debug mode

`brisa dev -d` enables debug mode. 

> [!NOTE]
>
> See more about [debugging documentation](/building-your-application/configuring/debugging).

## Skip tauri

`brisa dev -s` skips opening the desktop app when `output` is set to `desktop`, `ios`, or `android` in `brisa.config.ts`.

> [!NOTE]
>
> Learn more about the app strategy (`server`, `static`, `desktop`, `android`, `ios`) [here](/building-your-application/building/#app-strategy-static-server-desktop-android-ios).

