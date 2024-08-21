---
description: The Brisa CLI to start a server.
---

# Production Server (`brisa start`)

`brisa start` starts the application in production mode. To get a list of the available options with `brisa start`, run the following command inside your project directory:

```sh
brisa start --help
```

The output should look like this:

```sh
Usage: brisa start [options]
Options:
 -p, --port    Specify port
```

> [!WARNING]
>
> `brisa start` cannot be used with different [`output`](/building-your-application/configuring/output) than `server` (the default one). For `output` set to `static`, you can use alternatives like [`bunx serve out`](https://www.npmjs.com/package/serve) to run the build output and try the production assets locally.

## Changing the port

The application will start at `http://localhost:3000` by default. The default port can be changed with `-p`, like so:

```sh
brisa start -p 8080
```
