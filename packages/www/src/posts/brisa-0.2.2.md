---
title: "Brisa 0.2.2"
created: 01/06/2025
description: "Brisa release notes for version 0.2.2"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.2.webp
---

**Happy New Year**! 🎉 2025 is here, and we’re excited to kick it off with Brisa **v0.2.2**, packed with improvements, optimizations, and fixes.

> [!IMPORTANT]
>
> **Until February 2025** is [**open to proposals**](https://github.com/brisa-build/brisa/issues/197) to finish **defining** the **Brisa 1.0 Routemap** together with the community, so feel free to add your suggestions as a comment to this [GitHub issue](https://github.com/brisa-build/brisa/issues/197).
>
> After all, one person can have an idea and develop it, but great advances are achieved when several groups of people collaborate together in pursuit of a common goal.

Thanks to contributors:

- **[@AlbertSabate](https://github.com/AlbertSabate)**
- **[@aralroca](https://github.com/aralroca)**

## 🐞 Bug Fixes

- **Query Handling:** Fixed issues when queries contained duplicated keys. – [@AlbertSabate](https://github.com/AlbertSabate) in [#690](https://github.com/brisa-build/brisa/pull/690)
- **Node.js Streaming:** Ensured stream connections stay alive for slow chunks in Node.js environments. – [@aralroca](https://github.com/aralroca) in [#699](https://github.com/brisa-build/brisa/pull/699)
- **Build Process:** Marked `devDependencies` as external to improve the build process. – [@aralroca](https://github.com/aralroca) in [#701](https://github.com/brisa-build/brisa/pull/701)
- **TailwindCSS in Monorepos:** Fixed standalone builds of TailwindCSS in monorepo setups. – [@AlbertSabate](https://github.com/AlbertSabate) in [#694](https://github.com/brisa-build/brisa/pull/694)
- **SSR Modal Example:** Fixed type issues in the SSR modal example. – [@aralroca](https://github.com/aralroca) in [#695](https://github.com/brisa-build/brisa/pull/695)

## ⚡ Performance Improvements

- **Client Size Optimization:** Reduced the size of `brisa-element` by 26 bytes, making it even more lightweight for client-side use. – [@aralroca](https://github.com/aralroca) in [#696](https://github.com/brisa-build/brisa/pull/696)

## 📖 Documentation Updates

- **Enhanced Explanation:** Improved the `transferToClient` documentation to provide better clarity. – [@aralroca](https://github.com/aralroca) in [#693](https://github.com/brisa-build/brisa/pull/693)

## 🛠️ Maintenance

- **Upgrade:** Upgraded Bun to the latest version for improved compatibility and stability. – [@aralroca](https://github.com/aralroca) in [#692](https://github.com/brisa-build/brisa/pull/692)

## 📝 What's Changed

- **fix**: query handling with duplicated keys – [@AlbertSabate](https://github.com/AlbertSabate) in [#690](https://github.com/brisa-build/brisa/pull/690)
- **chore**: upgrade Bun – [@aralroca](https://github.com/aralroca) in [#692](https://github.com/brisa-build/brisa/pull/692)
- **docs**: improve `transferToClient` explanation – [@aralroca](https://github.com/aralroca) in [#693](https://github.com/brisa-build/brisa/pull/693)
- **fix**: standalone TailwindCSS builds in monorepos – [@AlbertSabate](https://github.com/AlbertSabate) in [#694](https://github.com/brisa-build/brisa/pull/694)
- **fix**: SSR modal example types – [@aralroca](https://github.com/aralroca) in [#695](https://github.com/brisa-build/brisa/pull/695)
- **perf**: reduce `brisa-element` client size – [@aralroca](https://github.com/aralroca) in [#696](https://github.com/brisa-build/brisa/pull/696)
- **fix**: keep alive stream connection for slow chunks in Node.js – [@aralroca](https://github.com/aralroca) in [#699](https://github.com/brisa-build/brisa/pull/699)
- **fix**: mark `devDependencies` as external – [@aralroca](https://github.com/aralroca) in [#701](https://github.com/brisa-build/brisa/pull/701)

## **Full Changelog**: [https://github.com/brisa-build/brisa/compare/0.2.1...0.2.2](https://github.com/brisa-build/brisa/compare/0.2.1...0.2.2)

**Support Us:** [Visit our shop](https://brisadotbuild.myspreadshop.es/) for Brisa swag! 🛍️

<div align="center">
<a href="https://brisadotbuild.myspreadshop.es/" alt="Brisa Shop" target="_blank">
<img width="400" height="425" src="/images/blog-images/shop.webp" alt="Brisa Shop" />
</a>
</div>
