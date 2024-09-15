---
description: Learn how to compile your Brisa application to a standalone binary.
---

# `compileTarget`

The `compileTarget` config property is used during `brisa build` to generate a standalone binary of your application. Compiled executables reduce memory usage and improve Brisa's start time.

**brisa.config.ts**:

```ts
import type { Configuration } from "brisa";

export default {
  compileTarget: "bun-linux-x64", // or any other option, the default is `auto`
} satisfies Configuration;
```

The default value is `auto`.

Options:

- `auto`: Brisa will choose the best target for your application.
- `bun-linux-x64`: The output is a Linux x64 binary.
- `bun-linux-arm64`: The output is a Linux ARM64 binary.
- `bun-windows-x64`: The output is a Windows x64 binary.
- `bun-darwin-x64`: The output is a macOS x64 binary.
- `bun-darwin-arm64`: The output is a macOS ARM64 binary.
- `none`: Disable the compilation, so instead of a standalone binary, is just transpiled and bundled.

> [!IMPORTANT]
>
> This feature only works with the [`output: 'bun'`](/building-your-application/building/bun-server) option.
