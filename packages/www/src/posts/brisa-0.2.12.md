---
title: "Brisa 0.2.12"
created: 05/03/2025
description: "Brisa release notes for version 0.2.12"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.12.webp
---

This release continues our preparations for **Brisa v0.3**, where we will introduce a brand new binary-based build system and overhaul the current build process. As part of this effort, we’re replacing all dynamic imports with static ones to enable a fully precompiled server runtime.

This shift not only paves the way for binary builds, but also sets the foundation for a much more efficient hot-reloading system — one that will rebuild **only the changed files** instead of restarting the entire app.

### ✨ Features

- **Static CSS imports**: CSS files are now statically imported during the build process ([#848](https://github.com/brisa-build/brisa/pull/848)).
- **Static Server Actions**: Server Actions are now statically imported, reducing runtime complexity and boosting performance ([#850](https://github.com/brisa-build/brisa/pull/850)).
    

### 🛠 Fixes

- 🧠 Fixed edge cases with Server Actions using `IfStatement` + `return` statements ([#852](https://github.com/brisa-build/brisa/pull/852)).
- ♻️ Hot-reloading is now more reliable for layouts, actions, and i18n files ([#853](https://github.com/brisa-build/brisa/pull/853)). 
- 📦 Reverted plugin filter logic to correctly resolve tarball paths and fix related tests ([#854](https://github.com/brisa-build/brisa/pull/854)).
- 🧹 Removed `brisa/macros` from the `server.js` bundle to further streamline the build ([#856](https://github.com/brisa-build/brisa/pull/856)).
    

### 🧱 Maintenance

- 🔧 Upgraded Bun version to stay in sync with the latest improvements ([#855](https://github.com/brisa-build/brisa/pull/855)).
  

**Full Changelog**: [github.com/brisa-build/brisa/compare/0.2.11...0.2.12](https://github.com/brisa-build/brisa/compare/0.2.11...0.2.12)
