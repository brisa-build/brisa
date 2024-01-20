---
title: Tauri
description: Learn how build a Brisa application with Tauri
---

## Init your desktop Brisa app

```sh
bunx tauri init -A my-app -W my-app -D ../out --dev-path http://localhost:3000 --before-dev-command 'bun dev --skip-desktop' --before-build-command 'bun run build'
```

## Run your desktop Brisa app

```sh
bunx tauri dev --port 3000
```

## Build your desktop Brisa app

1. Add some `identifier` in this file `/src-tauri/tauri.conf.json`. It's the field `tauri.bundle.identifier`.

TODO: needs first to support static export
