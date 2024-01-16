---
title: Tauri
description: Learn how build a Brisa application with Tauri
---

## Init your desktop Brisa app

```sh
bunx tauri init
```

```sh
✔ What is your app name? · my-app
✔ What should the window title be? · my-app
✔ Where are your web assets (HTML/CSS/JS) located, relative to the "<current dir>/src-tauri/tauri.conf.json" file that will be created? · build
✔ What is the url of your dev server? · https://my-app.fly.dev/
✔ What is your frontend dev command? · bun dev
✔ What is your frontend build command? · bun run build
```

## Run your desktop Brisa app

```sh
bunx tauri dev
```

## Build your desktop Brisa app

1. Add some `identifier` in this file `/src-tauri/tauri.conf.json`. It's the field `tauri.bundle.identifier`.

TODO: needs first to support static export
