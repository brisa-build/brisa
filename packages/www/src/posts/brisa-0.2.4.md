---
title: "Brisa 0.2.4"
created: 01/27/2025
description: "Brisa release notes for version 0.2.4"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.4.webp
---

**Brisa v0.2.4 is here!** 🎉

During the next weeks, Brisa is proud to collaborate with [**Winter Of Code 4.0**](https://winterofcode.tech/), **Google Developer Groups (GDG)**, on **campus IIIT Kalyani** (formerly known as GDSC IIIT Kalyani) to encourage innovation and learning in the open-source community. We're excited to support this initiative and help students grow their skills and knowledge. 🚀

This release focuses on critical fixes, better compatibility, and improved documentation. Let’s dive into what’s new!

This release brings a series of critical fixes and improvements, ensuring better compatibility with Bun 1.2, and enhanced documentation. Let’s dive into what’s new!

## 🐞 Bug Fixes

- **Server Action dependencies:** Fixed issues with action dependencies and subdependencies in the build process, improving stability. – [@aralroca](https://github.com/aralroca) in [#713](https://github.com/brisa-build/brisa/pull/713)
- **Bun 1.2 Compatibility:** Resolved build errors and adapted CSS handling for Bun 1.2, ensuring seamless integration. – [@aralroca](https://github.com/aralroca) in [#716](https://github.com/brisa-build/brisa/pull/716), [#717](https://github.com/brisa-build/brisa/pull/717)
- **BigInt Serialization:** Added proper handling for `bigint` values during build analysis, avoiding potential errors. – [@aralroca](https://github.com/aralroca) in [#727](https://github.com/brisa-build/brisa/pull/727)
- **Fix external CSS Parsers like Tailwind:** Fixed external CSS parsers (e.g., TailwindCSS, PandaCSS) to avoid conflicts with Bun CSS Parser on Bun 1.2. – [@aralroca](https://github.com/aralroca) in [#729](https://github.com/brisa-build/brisa/pull/729)


## 📖 Documentation Updates

- **TailwindCSS Docs:** Enhanced the documentation for better clarity on TailwindCSS integration. – [@rohits-web03](https://github.com/rohits-web03) in [#730](https://github.com/brisa-build/brisa/pull/730)
- **Improvements:** Multiple small fixes and improvements to documentation for accuracy and consistency. – [@0xflotus](https://github.com/0xflotus) in [#718](https://github.com/brisa-build/brisa/pull/718), [#722](https://github.com/brisa-build/brisa/pull/722), [#724](https://github.com/brisa-build/brisa/pull/724), [#725](https://github.com/brisa-build/brisa/pull/725), [#728](https://github.com/brisa-build/brisa/pull/728)


## 🎉 New Contributors

A warm welcome to our new contributors:

- **[@0xflotus](https://github.com/0xflotus)** made their first contribution in [#718](https://github.com/brisa-build/brisa/pull/718)
- **[@rohits-web03](https://github.com/rohits-web03)** made their first contribution in [#730](https://github.com/brisa-build/brisa/pull/730)

Thank you for helping improve Brisa!


## **Full Changelog**

[https://github.com/brisa-build/brisa/compare/0.2.3...0.2.4](https://github.com/brisa-build/brisa/compare/0.2.3...0.2.4)

**Support Us:** [Visit our shop](https://brisadotbuild.myspreadshop.es/) for Brisa swag! 🛍️

<div align="center"> <a href="https://brisadotbuild.myspreadshop.es/" alt="Brisa Shop" target="_blank"> <img width="400" height="425" src="/images/blog-images/shop.webp" alt="Brisa Shop" /> </a> </div>
