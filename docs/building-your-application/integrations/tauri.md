---
description: Understand how to integrate Tauri in your Brisa project
---

# Integrating Tauri

[Tauri](https://tauri.app/) is integrated into Brisa when you change the [`config.output`](/building-your-application/configuring/brisa-config-js#output) inside `brisa.config.ts` to one of the following values:

- `desktop` - for desktop applications
- `ios` - for iOS applications
- `android` - for Android applications

Example of a `brisa.config.ts` file with Tauri integration:

```ts
import type { Configuration } from "brisa";

export default {
  output: "desktop",
} as Configuration;
```

Thanks to Tauri, you can switch from a web application to a desktop, iOS, or Android application with minimal changes to your codebase. This integration allows you to leverage the full power of Tauri's capabilities while maintaining the Brisa development experience you are familiar with.
