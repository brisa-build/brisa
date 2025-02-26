---
title: "Brisa 0.1.7"
created: 11/29/2024
description: "Brisa release notes for version 0.1.7"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.1.7.webp
---

This release brings performance improvements, bug fixes, and new features to enhance your experience with Brisa.

## What's New

### Tailwind External Subdependencies Fix

We've resolved an issue where external Tailwind subdependencies caused problems during standalone builds. Everything should now work seamlessly.

### Hot Reload Enhancements

Improved hot-reload performance for multi-save scenarios and fixed feedback timing inaccuracies (bad milliseconds). Development workflows are now faster and smoother.

### Store Initialization Optimization

The store is now initialized only once when no Web Components are used, leading to better performance and fewer unnecessary operations.

### Tailwind Adapter: Embedded Configurable

A new feature in the Tailwind adapter allows you to configure an [`embedded`](/building-your-application/integrations/tailwind-css) option, offering more flexibility for your TailwindCSS setup.

## BTW; Brisa Shop is Live!

[Visit our shop](https://brisadotbuild.myspreadshop.es/) to get your Brisa swag and show your support!

<div align="center">
<a href="https://brisadotbuild.myspreadshop.es/" alt="Brisa Shop" target="_blank">
<img width="400" height="425" src="/images/blog-images/shop.webp" alt="Brisa Shop" />
</a>
</div>

## What's Changed

- **fix(build)**: fix Tailwind external subdependencies during standalone build – [@aralroca](https://github.com/aralroca) in [#638](https://github.com/brisa-build/brisa/pull/638)
- **chore**: upgrade Bun – [@aralroca](https://github.com/aralroca) in [#639](https://github.com/brisa-build/brisa/pull/639)
- **fix**: improve multi-save hot-reload time – [@aralroca](https://github.com/aralroca) in [#641](https://github.com/brisa-build/brisa/pull/641)
- **fix**: init store only once when no Web Components – [@aralroca](https://github.com/aralroca) in [#645](https://github.com/brisa-build/brisa/pull/645)
- **test**: adapt some tests to new store behavior – [@aralroca](https://github.com/aralroca) in [#646](https://github.com/brisa-build/brisa/pull/646)
- **refactor**: move CLI inside `src/bin` folder – [@aralroca](https://github.com/aralroca) in [#647](https://github.com/brisa-build/brisa/pull/647)
- **chore**: upgrade Bun – [@aralroca](https://github.com/aralroca) in [#649](https://github.com/brisa-build/brisa/pull/649)
- **fix(dx)**: fix bad milliseconds feedback during hotreload – [@aralroca](https://github.com/aralroca) in [#651](https://github.com/brisa-build/brisa/pull/651)
- **feat(tailwind-adapter)**: add `embedded` configurable – [@aralroca](https://github.com/aralroca) in [#652](https://github.com/brisa-build/brisa/pull/652)

**Full Changelog**: [https://github.com/brisa-build/brisa/compare/0.1.6...0.1.7](https://github.com/brisa-build/brisa/compare/0.1.6...0.1.7)
