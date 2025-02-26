---
title: "Brisa 0.2.3"
created: 01/19/2025
description: "Brisa release notes for version 0.2.3"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.3.webp
---

**Happy 2025 continues!** 🎉 We’re thrilled to announce the release of Brisa **v0.2.3**, bringing basically bug fixes.

> [!IMPORTANT]
>
> **Brisa 1.0 Routemap** is still open for community proposals until February 2025. We encourage everyone to contribute by sharing ideas in this [GitHub issue](https://github.com/brisa-build/brisa/issues/197). Let's shape the future of Brisa together! 🚀

Thanks to contributors:

- **[@aralroca](https://github.com/aralroca)**

## 🐞 Web Components Rendering

We fixed a long-standing issue where overlapping nodes and old connected nodes caused problems in reactivity with signals. This fix makes Brisa's Web Components much more robust and reliable. Though challenging, the effort was worth it to ensure seamless integration with Brisa's reactive ecosystem.

– [@aralroca](https://github.com/aralroca) in [#702](https://github.com/brisa-build/brisa/pull/702)

## 🐞 Build Process

Optimized build-time behavior by ensuring `package.json` is only read during the build process, avoiding bugs with standalone builds loading the wrong `package.json` in runtime, when it was not needed.

– [@aralroca](https://github.com/aralroca) in [#708](https://github.com/brisa-build/brisa/pull/708)

## 🐞 Server Actions

Resolved issues with soft redirect headers, improving the reliability of server actions in Brisa

– [@aralroca](https://github.com/aralroca) in [#710](https://github.com/brisa-build/brisa/pull/710)

## 📖 Documentation Updates

Improved the clarity and completeness of the integration command documentation to better guide users.

– [@aralroca](https://github.com/aralroca) in [#709](https://github.com/brisa-build/brisa/pull/709)

---

## **Full Changelog**

[https://github.com/brisa-build/brisa/compare/0.2.2...0.2.3](https://github.com/brisa-build/brisa/compare/0.2.2...0.2.3)

**Support Us:** [Visit our shop](https://brisadotbuild.myspreadshop.es/) for Brisa swag! 🛍️

<div align="center"> <a href="https://brisadotbuild.myspreadshop.es/" alt="Brisa Shop" target="_blank"> <img width="400" height="425" src="/images/blog-images/shop.webp" alt="Brisa Shop" /> </a> </div>
