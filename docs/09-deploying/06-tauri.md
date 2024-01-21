---
title: Tauri
description: Learn how build a Brisa application with Tauri
---

## Init your desktop Brisa desktop app

Brisa integrated [Tauri](https://tauri.app/) by adding this configuration to `brisa.config.ts`:

```ts
import type { Configuration } from "brisa";

export default {
  output: "desktop",
} satisfies Configuration;
```

To init them, run:

```sh
brisa dev
```

When you run it you will see that it opens a desktop app with your web and you can work with it in development, hotreload works the same as in the browser.

You will see that a folder `src-tauri` has been created. This is the folder with the integration of Brisa with Tauri.

If you want to change the size of the window, the icons, the title or more, you can do it in the file `src-tauri/tauri.conf.json`.

> [!NOTE]
>
> Take a look at Tauri configuration fields [here](https://tauri.app/v1/api/config).

## Build your Brisa desktop app

When you have `output: "desktop"` in your `brisa.config.ts` enabled, you can run:

```sh
bun run build
```

Then, the corresponding executables with your OS will be created.

It will detect your operating system and build a bundle accordingly. It currently supports:

- [Windows](https://tauri.app/v1/guides/building/windows): -setup.exe, .msi
- [macOS](https://tauri.app/v1/guides/building/macos): .app, .dmg
- [Linux](https://tauri.app/v1/guides/building/linux): .deb, .appimage

> [!IMPORTANT]
>
> The behavior of the build of Brisa will be like [static export](/docs/deploying/static-exports) since there will no longer be an active server but the desktop app is created with the assets (HTML, CSS, JS).

> [!CAUTION]
>
> Pure server stuff like api endpoints and server interactions will not work in runtime. All the interaction part should be in web-components only.

### Cross-platform build

Tauri is using native libraries of each OS, it is not possible to do a cross-platform build directly. To do so, it has to be done through a pipeline that has a matrix of different OS.

```yml
# ...
strategy:
  fail-fast: false
  matrix:
    platform: [macos-latest, ubuntu-20.04, windows-latest]
runs-on: ${{ matrix.platform }}
# ...
```

See a GitHub action example [here](https://tauri.app/v1/guides/building/cross-platform/#example-workflow).

> [!NOTE]
>
> The GitHub Token is automatically issued by GitHub for each workflow run without further configuration, which means there is no risk of secret leakage.

> [!NOTE]
>
> To learn more, take a look at [Tauri documentation](https://tauri.app/v1/guides/building/cross-platform/#example-workflow) about cross-platform build.
