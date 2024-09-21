---
description: Learn how to incorporate files from C ABI languages into your server files.
---

# Use C ABI files (zig, rust, c/c++, c#, nim, kotlin...)

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

> [!CAUTION]
>
> If you are using `node` as output, this documentation does not apply. You need to find the equivalent in Node.js.

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

Then, we need to move the generated files inside the `prebuild` folder.

> [!NOTE]
>
> This `prebuild` folder is used during `brisa dev` and `brisa build` where all the `prebuild` files are copied inside `build/prebuild`, to be able to use them later in runtime.

Example of script inside `package.json` to compile inside `prebuild` folder:

```json
{
  "scripts": {
    "dev": "brisa dev",
    "build": "brisa build",
    "start": "brisa start",
    "build:zig": "cd prebuild && bun run build:zig:for-your-computer && bun run build:zig:docker:oven/bun && cd ..",
    "build:zig:for-your-computer": "zig build-lib ../src/zig/add.zig -dynamic -OReleaseFast",
    "build:zig:docker:oven/bun": "zig build-lib ../src/zig/add.zig -dynamic -OReleaseFast -target x86_64-linux-musl"
  }
}
```

> [!CAUTION]
>
> If you do not have the `prebuild` folder you must create it.

## Create a JS/TS Bridge

Develop a JavaScript/TypeScript file to bridge to the compiled file.

```ts filename="src/utils/add.ts"
// src/utils/add.ts
import { dlopen, FFIType, suffix } from "bun:ffi";
import path from "node:path";

const compileFilePath = path.join(
  // You can use BRISA_BUILD_FOLDER env to access to the build folder
  Bun.env.BRISA_BUILD_FOLDER,
  // "prebuild" folder during build time is copied inside the build folder
  "prebuild",
  // `suffix` is either "dylib", "so", or "dll" depending on the platform
  // you don't have to use "suffix", it's just there for convenience
  `libadd.${suffix}`,
);

const lib = dlopen(compileFilePath, {
  add: {
    args: [FFIType.i32, FFIType.i32],
    returns: FFIType.i32,
  },
});

export default lib.symbols.add;
```

Ensure correct typing for the `args` and the `return`.

Access the environment variable `BRISA_BUILD_FOLDER` via `process.env.BRISA_BUILD_FOLDER` or `Bun.env.BRISA_BUILD_FOLDER`. This represents the path to the build folder, where the `prebuild` files are located.

> [!NOTE]
>
> `Bun.env.BRISA_BUILD_FOLDER` works in `development` and `production`.

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
