---
title: "Brisa 0.2.5 & 0.2.6 Release Notes"
created: 02/06/2025
description: "Brisa release notes for version 0.2.5"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.5.webp
---

> [!IMPORTANT]
> **Notice**: This release includes a critical regression in Server Actions, which was promptly fixed in [v0.2.6](https://github.com/brisa-build/brisa/releases/tag/0.2.6) the following day.

**Brisa v0.2.5 is here!** 🎉

This release brings critical fixes, enhanced stability, and improved performance. We've also made important updates to the diffing algorithm, middleware behavior, and build process. Let’s dive into what's new!


## 🐞 Bug Fixes

- **Asset Parsing:** Avoided unnecessary asset parsing to improve performance. – [@aralroca](https://github.com/aralroca) in [#734](https://github.com/brisa-build/brisa/pull/734)
- **Cloudflare Compatibility:** Ensured Brisa scripts always execute properly in SPA mode by avoiding Cloudflare Rocket Loader interference. – [@aralroca](https://github.com/aralroca) in [#741](https://github.com/brisa-build/brisa/pull/741)
- **Streaming Bug:** Upgraded the diffing algorithm to fix streaming-related issues. – [@aralroca](https://github.com/aralroca) in [#743](https://github.com/brisa-build/brisa/pull/743)
- **Server Store Transfer:** Fixed issues when transferring store data between client and server. – [@aralroca](https://github.com/aralroca) in [#746](https://github.com/brisa-build/brisa/pull/746)
- **RPC Store Sync:** Ensured the original store remains in sync during remote procedure calls. – [@aralroca](https://github.com/aralroca) in [#747](https://github.com/brisa-build/brisa/pull/747)
- **Middleware & Layouts:** Ensured middleware and layouts correctly await response headers. – [@AlbertSabate](https://github.com/AlbertSabate) in [#738](https://github.com/brisa-build/brisa/pull/738)

## 🚀 Enhancements

- **Bun Upgrade:** Upgraded to the latest Bun version for better stability and performance. – [@aralroca](https://github.com/aralroca) in [#736](https://github.com/brisa-build/brisa/pull/736), [#742](https://github.com/aralroca) in [#742](https://github.com/brisa-build/brisa/pull/742)
- **Tailwind v4 Support:** Updated TailwindCSS to v4 stable, ensuring full compatibility. – [@AlbertSabate](https://github.com/AlbertSabate) in [#721](https://github.com/brisa-build/brisa/pull/721)
- **Dependency Updates:** Various dependency upgrades to improve website performance. – [@aralroca](https://github.com/aralroca) in [#745](https://github.com/brisa-build/brisa/pull/745)


## 📖 Documentation Updates

- **Response Headers:** Added an important note about handling response headers in middleware and layouts. – [@aralroca](https://github.com/aralroca) in [#737](https://github.com/brisa-build/brisa/pull/737)

## **Full Changelog**

[https://github.com/brisa-build/brisa/compare/0.2.4...0.2.5](https://github.com/brisa-build/brisa/compare/0.2.4...0.2.5)

**Support Us:** [Visit our shop](https://brisadotbuild.myspreadshop.es/) for Brisa swag! 🛍️

<div align="center"> <a href="https://brisadotbuild.myspreadshop.es/" alt="Brisa Shop" target="_blank"> <img width="400" height="425" src="/images/blog-images/shop.webp" alt="Brisa Shop" /> </a> </div>
