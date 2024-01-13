---
title: Use C ABI files (zig, rust, c/c++, c#, nim, kotlin...)
description: Learn how to incorporate files from C ABI languages into your server files.
---

If you need to utilize files from different C ABI languages (Zig, Rust, C/C++, C#, Nim, Kotlin, etc.), you can achieve this as follows:

## Create Your Zig, Rust, or Other File:

Zig:

```zig filename="src/utils/add.zig"
// add.zig
pub export fn add(a: i32, b: i32) i32 {
  return a + b;
}
```

or with Rust:

```rs filename="src/utils/add.rs"
// add.rs
#[no_mangle]
pub extern "C" fn add(a: isize, b: isize) -> isize {
    a + b
}
```

## Compile Your Files

You need to compile it before using it in your Brisa app.

Zig:

```sh
zig build-lib add.zig -dynamic -OReleaseFast
```

or with Rust:

```sh
rustc --crate-type cdylib add.rs
```

Then, we need to move the generated files inside the `build` folder.

We recommend to use the `predev` and `prebuild` script to your `package.json` to compile and move them.

Instead of:

```json
{
  "scripts": {
    "dev": "brisa dev",
    "build": "brisa build",
    "start": "brisa start"
  }
}
```

Add these scripts:

```json
{
  "scripts": {
    "predev": "bun run build-ffi",
    "dev": "brisa dev",
    "prebuild": "bun run build-ffi",
    "build": "brisa build",
    "start": "brisa start",
    "build-ffi": "zig build-lib src/zig/add.zig -dynamic -OReleaseFast"
  }
}
```

> [!IMPORTANT]
>
> During the build process, Brisa automatically moves all generated files starting with `lib*` from the root to the build folder in both development (`predev`) and production (`prebuild`).

## Create a JS/TS Bridge

Develop a JavaScript/TypeScript file to bridge to the compiled file.

```ts filename="src/utils/add.ts"
// src/utils/add.ts
import { dlopen, FFIType, suffix } from "bun:ffi";
import path from "node:path";

// `suffix` is either "dylib", "so", or "dll" depending on the platform
// you don't have to use "suffix", it's just there for convenience
const lib = dlopen(path.join(Bun.env.BRISA_BUILD_FOLDER, `libadd.${suffix}`), {
  add: {
    args: [FFIType.i32, FFIType.i32],
    returns: FFIType.i32,
  },
});

export default lib.symbols.add;
```

Ensure correct typing for the `args` and the `return`.

Access the environment variable `BRISA_BUILD_FOLDER` via `process.env.BRISA_BUILD_FOLDER` or `Bun.env.BRISA_BUILD_FOLDER`. This represents the path to the build folder, where the `lib*` files are located.

## Consume it in Your Server Code

Now, you can use it in any server file: components, layout, middleware, API, response headers, etc.

```tsx filename="src/pages/index.tsx"
// src/pages/index.tsx
import add from "@/utils/add";

export default function HomePage() {
  return <div>5+5 is {add(5, 5)}</div>;
}
```

> [!NOTE]
>
> For more details, such as dealing with pointers, refer to [Bun's FFI documentation](https://bun.sh/docs/api/ffi).
