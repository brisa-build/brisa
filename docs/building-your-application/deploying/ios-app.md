---
title: iOS app
description: Learn how build a Brisa application with Tauri
---

## Brisa iOS Applications (Tauri integration)

This documentation outlines the process of building a Brisa ios application using [Tauri](https://tauri.app/). Tauri is seamlessly integrated into Brisa by configuring the `brisa.config.ts` file as follows:

```ts
import type { Configuration } from "brisa";

export default {
  output: "ios",
} satisfies Configuration;
```

To initialize the development environment, run the following command:

```sh
brisa dev
```

> [!IMPORTANT]
>
> **Prerequisits**: You need to download iOS targets and follow these [steps from Tauri documentation](https://beta.tauri.app/guides/prerequisites/#ios).

Executing this command launches a ios app, integrating your web application. The development environment supports hot-reloading, mirroring the behavior of a browser. Notably, the integration creates a `src-tauri` folder, representing the fusion of Brisa with Tauri.

Customizing the icons, title, and other attributes can be achieved by modifying the `src-tauri/tauri.conf.json` file.

> [!NOTE]
>
> Explore Tauri's configuration fields [here](https://tauri.app/api/config).

## Building your Brisa iOS App

When the `output: "ios"` configuration is set in your `brisa.config.ts`, execute the following command to build the application:

```sh
bun run build
```

This command generates the corresponding `.ipa` (iOS App Store Package).

> [!IMPORTANT]
>
> The build behavior is akin to [static export](/building-your-application/deploying/static-exports), as there won't be an active server, and the ios app is created with the bundled assets (HTML, CSS, JS).

> [!CAUTION]
>
> Pure server-related functionalities, such as API endpoints and server interactions, will not function at runtime. All interactions should be encapsulated within web components.
