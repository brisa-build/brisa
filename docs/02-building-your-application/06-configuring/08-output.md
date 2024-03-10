---
title: Output
description: Learn how to build with different types of outputs
---

Brisa, offers versatile output configuration options to tailor your build output according to your deployment needs. The `output` configuration property in `brisa.config.ts` allows you to define the type of output you desire, with options such as `server`, `static`, and `desktop`.

## Understanding Output Types

### 1. Server Output (`server`)

The `server` output type generates a deployable server that can be hosted on a server infrastructure ([Bun runtime](https://bun.sh/docs/cli/run)). This is the default output type. To utilize this output type in your Brisa project, ensure that your `brisa.config.ts` file includes the following:

```ts
import type { Configuration } from "brisa";

export default {
  // "server" is the default value when this configuration is not set
  output: "server",
} satisfies Configuration;
```

> [!NOTE]
>
> It is recommended to use the `server` output type to leverage the complete set of features Brisa provides, enhancing your project with middleware capabilities, API endpoints, and server-specific functionalities.

### 2. Static Output (`static`)

The `static` output type creates a static export suitable for deployment to static hosting services. To configure your Brisa project for static output, adjust your `brisa.config.ts` as follows:

```ts
import type { Configuration } from "brisa";

export default {
  output: "static",
} satisfies Configuration;
```

> [!CAUTION]
>
> Pure server stuff like api endpoints and server interactions will not work in runtime. All the interaction part should be in web-components only.

### 3. Desktop Output (`desktop`)

The `desktop` output type is designed for creating deployable desktop applications, integrated with [Tauri](https://tauri.app/). To set up your Brisa project for desktop output, modify your `brisa.config.ts` as shown below:

```ts
import type { Configuration } from "brisa";

export default {
  output: "desktop",
} satisfies Configuration;
```

Once activated you can call `brisa dev` to work locally with hotreloading in the desktop app or `brisa build` to build the desktop app native executables.

> [!TIP]
>
> You can do `brisa dev --skip-tauri` or `brisa build --skip-tauri` if you want to avoid creating and loading the desktop application.

> [!CAUTION]
>
> In production the build is done as static export, since there is no server.
> Pure server stuff like api endpoints and server interactions will not work in runtime. All the interaction part should be in web-components only.

> [!NOTE]
>
> Lean how to [deploy a desktop app here](/docs/building-your-application/deploying/tauri).

## Additional Considerations

When configuring your output type, it's crucial to consider the deployment environment and requirements. Each output type serves a distinct purpose, and choosing the right one ensures optimal performance and compatibility.

To view the changes in the output, run the `brisa build` command. In the case of `server` output, the build is generated in the `build` folder, while for `static` and `desktop` output, an additional `out` folder is created. The `build` folder is retained as it is needed to generate the initial build before generating static files or the desktop app in the separate `out` folder.

> [!NOTE]
>
> Learn more details about static export [here](/docs/building-your-application/deploying/static-exports).

> [!TIP]
>
> If your application requires server-side features, like middleware or API endpoints, opt for the `server` output. For static websites, select the `static` output, and for desktop applications integrated with Tauri, use the `desktop` output.
