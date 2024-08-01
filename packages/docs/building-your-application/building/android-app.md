---
description: Learn how build a Brisa application with Tauri
---

# Android app

## Brisa Android Applications (Tauri integration)

This documentation outlines the process of building a Brisa android application using [Tauri](https://tauri.app/). Tauri is seamlessly integrated into Brisa by configuring the `brisa.config.ts` file as follows:

```ts
import type { Configuration } from "brisa";

export default {
  output: "android",
} satisfies Configuration;
```

To initialize the development environment, run the following command:

```sh
brisa dev
```

> [!IMPORTANT]
>
> **Prerequisits**: You need to download [Android Studio](https://developer.android.com/studio) and follow these [steps from Tauri documentation](https://beta.tauri.app/guides/prerequisites/#android).

Executing this command launches a android app, integrating your web application. The development environment supports hot-reloading, mirroring the behavior of a browser. Notably, the integration creates a `src-tauri` folder, representing the fusion of Brisa with Tauri.

Customizing the icons, title, and other attributes can be achieved by modifying the `src-tauri/tauri.conf.json` file.

> [!NOTE]
>
> Explore Tauri's configuration fields [here](https://tauri.app/api/config).

## Building your Brisa Android App

When the `output: "android"` configuration is set in your `brisa.config.ts`, execute the following command to build the application:

```sh
bun run build
```

This command generates the corresponding `.apk`.

> [!IMPORTANT]
>
> The build behavior is akin to [static export](/building-your-application/building/static-site-app), as there won't be an active server, and the android app is created with the bundled assets (HTML, CSS, JS).

> [!CAUTION]
>
> Pure server-related functionalities, such as API endpoints and server interactions, will not function at runtime. All interactions should be encapsulated within web components.
