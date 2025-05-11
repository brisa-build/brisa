---
title: "Brisa 0.2.13"
created: 05/11/2025
description: "Brisa release notes for version 0.2.13"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.13.webp
---

This release continues refining the build system and internal tooling as we prepare for Brisa v0.3. Key improvements include major optimizations in server output size and fixes that improve reliability across builds and CLI utilities.

### 🛠 Fixes & Improvements

- 🧩 **Static build fix**: Re-initialized constants to correctly generate static pages ([#858](https://github.com/brisa-build/brisa/pull/858))
- 📦 **Server size optimization**: Reduced the size of `server.js` by **71%** for leaner deployments ([#860](https://github.com/brisa-build/brisa/pull/860))
- 🧹 Removed unnecessary externals in `brisa add` CLI scripts ([#863](https://github.com/brisa-build/brisa/pull/863))
- 🛠 Fixed build path resolution for integration modules ([#867](https://github.com/brisa-build/brisa/pull/867))
    

### 📚 Documentation

- Updated `CONTRIBUTING.md` to improve the contributor experience ([#868](https://github.com/brisa-build/brisa/pull/868))
- Replaced `bun install` with `bun add` in docs for clarity ([#866](https://github.com/brisa-build/brisa/pull/866))


### 🧱 Maintenance

- 🔧 Upgraded Bun in multiple PRs to stay up-to-date with its latest improvements ([#859](https://github.com/brisa-build/brisa/pull/859), [#870](https://github.com/brisa-build/brisa/pull/870))
    
### 👥 New Contributors

- [@yvvki](https://github.com/yvvki) made their first contribution – thank you! 🎉 ([#866](https://github.com/brisa-build/brisa/pull/866))
    

---

**Full Changelog**: [github.com/brisa-build/brisa/compare/0.2.12...0.2.13](https://github.com/brisa-build/brisa/compare/0.2.12...0.2.13)