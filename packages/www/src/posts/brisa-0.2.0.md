---
title: "Brisa 0.2.0 Release Notes"
created: 12/08/2024
description: "Brisa release notes for version 0.2.0"
author: Aral Roca
author_site: https://x.com/aralroca
---

We’re thrilled to announce **Brisa 0.2.0**, a minor milestone in Brisa's journey. This release introduces **official support for Deno**, alongside multiple performance optimizations and important fixes. Let's dive into the highlights!

<div align="center">
<iframe width="560" height="315" src="https://www.youtube.com/embed/-OVJ7O4unVk" title="Brisa v0.2" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## 🦕 Deno Support

Brisa now officially supports [**Deno**](/building-your-application/building/deno-server) as an output target. Here’s what’s new:

- **Output Configuration:** Use `output: 'deno'` in your `brisa.config.ts` to build for Deno.
- **Deno-Specific Configurations:** Brisa leverages `deno.json` for custom setups, automatically placed in your build directory.
- **CLI Integration:** Running `brisa start` detects the Deno output and uses `Deno.serve` for serving your application.

<div align="center">
<a href="https://brisa.build/building-your-application/building/deno-server" alt="Deno docs" target="_blank">
<img width="200" height="200" src="/images/blog-images/deno-logo.png" alt="Deno logo" />
</a>
</div>

Brisa every time is more JS runtime agnostic, and we are excited to see how you will use it with Deno!

## 🚀 Key Fixes and Improvements

- **Performance Optimizations:** Client builds have been further optimized, enhancing build times and overall performance.

<img width="775" height="461" src="/images/blog-images/build-time-performance.webp" alt="Brisa Build Time improvement" />

- **Improved Compatibility:**
  - Added a polyfill for `Promise.try` to ensure working in Node.js and Deno.
  - Fixed HTTP response issues with uncoded `ReadableStream`.
  - Resolved locale-changing issues in navigation for i18n.
- **CLI Improvements:**
  - Fixed `brisa start` to correctly load `brisa.config.ts` for all outputs.
  - Enhanced build consistency across output types.

## 🛠️ Recap: Key Features from 0.1.x Releases

### **Development Tools**

- **PandaCSS Integration** (0.1.1): Seamlessly use PandaCSS within Brisa for robust styling options.
- **Hot Reload Enhancements** (0.1.6, 0.1.7): Improved hot-reload for multi-save scenarios, making your development workflows faster and more reliable.
- **`idleTimeout` Configuration** (0.1.2): Fine-tune connection handling with the `idleTimeout` property for more predictable server behavior.

### **Routing & Middleware**

- **Route Rewrite Support** (0.1.3): Dynamically rewrite routes with middleware, enabling flexible routing scenarios.
- **Improved SPA Middleware** (0.1.3): Added support for transforming hard redirects into soft redirects in SPA navigation, streamlining client-side transitions.

### **Server-Side Rendering**

- **SSR Support for Web Components** (0.1.5): Extended support for `self` in Web Components during SSR, enabling advanced interactions with attributes, styles, and events at the server level.

### **API Utilities**

- **`getServer` API** (0.1.3): Access the Brisa server instance directly to extend its functionality or introspect runtime details.
- **Streaming HTML from Async Generators** (0.1.2): Combine SQLite queries with async generators for streaming HTML content directly to the client, unlocking performance benefits for large datasets.

## What's Changed

- **fix(example)**: update wc external dep to fix warning – [@aralroca](https://github.com/aralroca) in [#653](https://github.com/brisa-build/brisa/pull/653)
- **perf**: optimize client builds – [@aralroca](https://github.com/aralroca) in [#643](https://github.com/brisa-build/brisa/pull/643)
- **fix(node)**: add `Promise.try` polyfill to fix error with Node – [@aralroca](https://github.com/aralroca) in [#656](https://github.com/brisa-build/brisa/pull/656)
- **feat**: add `output: 'deno'` – [@aralroca](https://github.com/aralroca) in [#657](https://github.com/brisa-build/brisa/pull/657)
- **feat**: use `deno.json` and move it inside build – [@aralroca](https://github.com/aralroca) in [#658](https://github.com/brisa-build/brisa/pull/658)
- **feat(cli)**: run Deno on `brisa start` when output is 'deno' – [@aralroca](https://github.com/aralroca) in [#660](https://github.com/brisa-build/brisa/pull/660)
- **fix(cli)**: fix `brisa start` to load correct `brisa.config` – [@aralroca](https://github.com/aralroca) in [#662](https://github.com/brisa-build/brisa/pull/662)
- **docs(www)**: add Deno to the home – [@aralroca](https://github.com/aralroca) in [#663](https://github.com/brisa-build/brisa/pull/663)
- **fix(build)**: co-relate details with the correct output – [@aralroca](https://github.com/aralroca) in [#666](https://github.com/brisa-build/brisa/pull/666)
- **fix(render)**: fix uncoded `ReadableStream` in HTTP responses – [@aralroca](https://github.com/aralroca) in [#668](https://github.com/brisa-build/brisa/pull/668)
- **fix(i18n)**: fix change locale from navigate – [@aralroca](https://github.com/aralroca) in [#669](https://github.com/brisa-build/brisa/pull/669)
- **feat(deno)**: use `Deno.serve` – [@aralroca](https://github.com/aralroca) in [#659](https://github.com/brisa-build/brisa/pull/659)

**Full Changelog**: [https://github.com/brisa-build/brisa/compare/0.1.7...0.2.0](https://github.com/brisa-build/brisa/compare/0.1.7...0.2.0)

---

[Visit our shop](https://brisadotbuild.myspreadshop.es/) to get your Brisa swag and show your support!

<div align="center">
<a href="https://brisadotbuild.myspreadshop.es/" alt="Brisa Shop" target="_blank">
<img width="400" height="425" src="/images/blog-images/shop.webp" alt="Brisa Shop" />
</a>
</div>
