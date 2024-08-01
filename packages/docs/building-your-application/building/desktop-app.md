---
description: Learn how build a Brisa application with Tauri
---

# Desktop app

## Brisa Desktop Applications (Tauri integration)

This documentation outlines the process of building a Brisa desktop application using [Tauri](https://tauri.app/). Tauri is seamlessly integrated into Brisa by configuring the `brisa.config.ts` file as follows:

```ts
import type { Configuration } from "brisa";

export default {
  output: "desktop",
} satisfies Configuration;
```

To initialize the development environment, run the following command:

```sh
brisa dev
```

Executing this command launches a desktop app, integrating your web application. The development environment supports hot-reloading, mirroring the behavior of a browser. Notably, the integration creates a `src-tauri` folder, representing the fusion of Brisa with Tauri.

Customizing the window size, icons, title, and other attributes can be achieved by modifying the `src-tauri/tauri.conf.json` file.

> [!NOTE]
>
> Explore Tauri's configuration fields [here](https://tauri.app/api/config).

## Building your Brisa Desktop App

When the `output: "desktop"` configuration is set in your `brisa.config.ts`, execute the following command to build the application:

```sh
bun run build
```

This command generates the corresponding executables tailored to your operating system. The supported platforms include:

- [Windows](https://tauri.app/v1/guides/building/windows): -setup.exe, .msi
- [macOS](https://tauri.app/v1/guides/building/macos): .app, .dmg
- [Linux](https://tauri.app/v1/guides/building/linux): .deb, .appimage

> [!IMPORTANT]
>
> The build behavior is akin to [static export](/building-your-application/deploying/static-exports), as there won't be an active server, and the desktop app is created with the bundled assets (HTML, CSS, JS).

> [!CAUTION]
>
> Pure server-related functionalities, such as API endpoints and server interactions, will not function at runtime. All interactions should be encapsulated within web components.

### Cross-Platform Build

Tauri relies on native libraries for each OS, preventing a direct cross-platform build. A cross-platform build can be achieved through a matrix-based pipeline.

```yml
# ...
strategy:
  fail-fast: false
  matrix:
    platform: [macos-latest, ubuntu-20.04, windows-latest]
runs-on: ${{ matrix.platform }}
# ...
```

[Here's the full example](https://tauri.app/v1/guides/building/cross-platform/#example-workflow) YAML configuration for GitHub Actions.

> [!NOTE]
>
> The GitHub Token is automatically issued by GitHub for each workflow run without further configuration, ensuring no risk of secret leakage.

> [!NOTE]
>
> For more details, refer to the [Tauri documentation](https://tauri.app/v1/guides/building/cross-platform/#example-workflow) on cross-platform builds.
