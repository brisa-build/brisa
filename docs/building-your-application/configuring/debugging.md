---
title: Debugging
description: Learn how to debug your Brisa application
---

## Debugging with the web debugger

### Client-side code

Start your development server as usual by running `bun dev` (or `brisa dev`). Once the server starts, open `http://localhost:3000` (or your alternate URL) in Chrome. Next, open Chrome's Developer Tools (`Ctrl+Shift+J` on Windows/Linux, `⌥+⌘+I` on macOS), then go to the **Sources** tab.

Now, any time your client-side code reaches a [`debugger`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/debugger) statement, code execution will pause and that file will appear in the debug area. You can also press `Ctrl+P` on Windows/Linux or `⌘+P` on macOS to search for a file and set breakpoints manually. Note that when searching here, your source files will have paths starting with `webpack://_N_E/./`.

### Server-side code

Brisa use the Bun debugger that speaks the WebKit Inspector Protocol. To enable debugging when running code with Brisa, use the `bun dev:debug` (or `brisa dev --debug`) command. For demonstration purposes, consider the following simple web server.

```sh
[ wait ]   starting the development server...
[ info ]   compiled successfully in 170.11ms.
--------------------- Bun Inspector ---------------------
Listening:
  ws://localhost:6499/7195wck9r6h
Inspect in browser:
  https://debug.bun.sh/#localhost:6499/7195wck9r6h
--------------------- Bun Inspector ---------------------
[ info ]   hot reloading enabled
[ ready ]  listening on http://localhost:3000...
```

This automatically starts a WebSocket server on an available port that can be used to introspect the running Bun process. Various debugging tools can connect to this server to provide an interactive debugging experience.

Bun hosts a web-based debugger at `debug.bun.sh`. It is a modified version of WebKit's Web Inspector Interface, which will look familiar to Safari users.

Open the provided `debug.bun.sh` URL in your browser to start a debugging session. From this interface, you'll be able to view the source code of the running file, view and set breakpoints, and execute code with the built-in console.
