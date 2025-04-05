---
title: "Brisa 0.2.10"
created: 04/05/2025
description: "Brisa release notes for version 0.2.10"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.10.webp
---

🚀 **Brisa v0.2.10 is out!**  
This is a foundational release preparing the ground for **binary compilation** in future versions. While the feature isn't fully landed yet, this update already brings **performance improvements** and paves the way for what's next.

## ⚙️ Context: Towards Binary Compilation

To enable compiling Brisa into a single binary in future releases, we've started replacing **dynamic imports** with **static modules** inside `server.js`. This change allows Bun to analyze dependencies statically—essential for producing a compiled binary.

Even though this is just the beginning, we’ve already observed **improvements in requests per second (RPS)** thanks to fewer runtime evaluations and better startup performance.

We're releasing these changes incrementally to keep releases manageable and easier to test, instead of dropping a huge update later.

## ✨ Key Improvements

### 🔁 Replaced Dynamic Imports

The following parts of Brisa now use **static imports** instead of dynamic ones:

- ✅ Middleware
- ✅ i18n configuration
- ✅ `brisa.config`
- ✅ Web integrations
- ✅ Layout and page routes
- ✅ WebSocket handlers

This transition helps prepare for compilation and **reduces cold-start overhead**.

## 🐞 Bug Fixes & Improvements

- **Improved Hot Reloading** for `brisa-project-internals` during development – [#821](https://github.com/brisa-build/brisa/pull/821)  
- **Fixed i18n script behavior** on navigation and static builds – [#823](https://github.com/brisa-build/brisa/pull/823), [#824](https://github.com/brisa-build/brisa/pull/824)  
- **Allow empty pages to build properly** – [#819](https://github.com/brisa-build/brisa/pull/819)  
- **More accurate page identification** using page name instead of file path – [#820](https://github.com/brisa-build/brisa/pull/820)

## 🔄 Maintenance

- Upgraded Bun in multiple places for improved compatibility and speed – [#803](https://github.com/brisa-build/brisa/pull/803), [#806](https://github.com/brisa-build/brisa/pull/806), [#814](https://github.com/brisa-build/brisa/pull/814)
- Updated MIME types and project internals resolution for correctness and stability – [#807](https://github.com/brisa-build/brisa/pull/807)

## 🧪 What's Next?

The next steps will focus on **leveraging all these static modules** to produce an actual **single binary** executable of your Brisa app. We’re getting close!  

Stay tuned for that in upcoming releases. 🔧✨

## **Full Changelog**

* chore: migrate script to latest Bun way by [@aralroca](https://github.com/aralroca) in [#795](https://github.com/brisa-build/brisa/pull/795)
* fix(build): transform middleware import from dynamic to static by [@aralroca](https://github.com/aralroca) in [#796](https://github.com/brisa-build/brisa/pull/796)
* fix(build): transform i18n import from dynamic to static by [@aralroca](https://github.com/aralroca) in [#800](https://github.com/brisa-build/brisa/pull/800)
* fix(build): transform brisa.config import from dynamic to static by [@aralroca](https://github.com/aralroca) in [#802](https://github.com/brisa-build/brisa/pull/802)
* chore: upgrade bun by [@aralroca](https://github.com/aralroca) in [#803](https://github.com/brisa-build/brisa/pull/803)
* fix(build): transform web integrations import from dynamic to static by [@aralroca](https://github.com/aralroca) in [#805](https://github.com/brisa-build/brisa/pull/805)
* chore: upgrade bun by [@aralroca](https://github.com/aralroca) in [#806](https://github.com/brisa-build/brisa/pull/806)
* fix(build): fix `brisa-project-internals` resolution by [@aralroca](https://github.com/aralroca) in [#807](https://github.com/brisa-build/brisa/pull/807)
* fix(build): transform layout module from dynamic import to static by [@aralroca](https://github.com/aralroca) in [#809](https://github.com/brisa-build/brisa/pull/809)
* fix(build): transform all page routes import from dynamic to static by [@aralroca](https://github.com/aralroca) in [#811](https://github.com/brisa-build/brisa/pull/811)
* fix(build): transform websocket import from dynamic to static by [@aralroca](https://github.com/aralroca) in [#813](https://github.com/brisa-build/brisa/pull/813)
* chore: upgrade bun & mime-type by [@aralroca](https://github.com/aralroca) in [#814](https://github.com/brisa-build/brisa/pull/814)
* fix: export full static web integrations module by [@aralroca](https://github.com/aralroca) in [#816](https://github.com/brisa-build/brisa/pull/816)
* fix: export full static middleware module by [@aralroca](https://github.com/aralroca) in [#817](https://github.com/brisa-build/brisa/pull/817)
* fix: export full i18n + config static module by [@aralroca](https://github.com/aralroca) in [#818](https://github.com/brisa-build/brisa/pull/818)
* fix: allow build empty page by [@aralroca](https://github.com/aralroca) in [#819](https://github.com/brisa-build/brisa/pull/819)
* fix: use page name instead of filePath to identify pages by [@aralroca](https://github.com/aralroca) in [#820](https://github.com/brisa-build/brisa/pull/820)
* fix(hot-reload): fix hot-reloading with brisa-project-internals by [@aralroca](https://github.com/aralroca) in [#821](https://github.com/brisa-build/brisa/pull/821)
* fix(i18n): re-load client i18n keys during navigation by [@aralroca](https://github.com/aralroca) in [#823](https://github.com/brisa-build/brisa/pull/823)
* fix(i18n): fix i18n script navigation keys on static output by [@aralroca](https://github.com/aralroca) in [#824](https://github.com/brisa-build/brisa/pull/824)



🔗 [View on GitHub](https://github.com/brisa-build/brisa/compare/0.2.9...0.2.10)


❤️ **Support Brisa** – [Get your swag!](https://brisadotbuild.myspreadshop.es/)  
🛍️ Wear Brisa with pride and help the project grow.

<div align="center">  
<a href="https://brisadotbuild.myspreadshop.es/" target="_blank">  
<img width="400" height="425" src="/images/blog-images/shop.webp" alt="Brisa Shop" />  
</a>  
</div>