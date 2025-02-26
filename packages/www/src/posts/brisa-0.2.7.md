---
title: "Brisa 0.2.7"
created: 02/22/2025
description: "Brisa release notes for version 0.2.7"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.7.webp
---

This release introduces **new features, bug fixes, and documentation improvements** to enhance the Brisa experience. Let’s dive into what's new!

## ✨ New Features

### `peek()`

If you want to get the value of a signal without subscribing to an effect, you can use the `peek` method:

```tsx
const count = state<number>(0);
const addition = state<number>(1);

effect(() => {
  count.value = count.peek() + addition.peek();
});
```

In this example, the `count` state will be updated only when the `addition` state changes.

- **Signals: `peek()` Method** – Added `peek()` to signals, allowing you to read the value without tracking dependencies. Also, improved documentation for `store.Map`. – [@aralroca](https://github.com/aralroca) in [#752](https://github.com/brisa-build/brisa/pull/752)

## 🐞 Bug Fixes

- **Server Actions:** Now only imports valid identifiers, preventing unintended issues. – [@aralroca](https://github.com/aralroca) in [#757](https://github.com/brisa-build/brisa/pull/757)
- **Type Safety in i18n:** Improved type safety when returning objects in i18n. – [@aralroca](https://github.com/aralroca) in [#762](https://github.com/brisa-build/brisa/pull/762)
- **i18n & `notFound()` Handling:** Ensured i18n correctly resolves after calling `notFound()`. – [@aralroca](https://github.com/aralroca) in [#764](https://github.com/brisa-build/brisa/pull/764)

## 📖 Documentation & Examples Updates

- **Reactivity Docs:** Enhanced documentation for Brisa’s reactivity system and types. – [@aralroca](https://github.com/aralroca) in [#753](https://github.com/brisa-build/brisa/pull/753)
- **Web Context Docs:** Improved clarity and structure in web context documentation. – [@aralroca](https://github.com/aralroca) in [#760](https://github.com/brisa-build/brisa/pull/760)
- **New Example:** Added a **WebSocket chat example** to showcase real-time communication. – [@aralroca](https://github.com/aralroca) in [#755](https://github.com/brisa-build/brisa/pull/755)
- **Docs Fixes:** Fixed minor variable issues and improved consistency. – [@aralroca](https://github.com/aralroca) in [#759](https://github.com/brisa-build/brisa/pull/759)

## 🔄 Maintenance

- **Dependency Upgrades:** Updated dependencies for better stability and performance. – [@aralroca](https://github.com/aralroca) in [#754](https://github.com/brisa-build/brisa/pull/754)

## **Full Changelog**

🔗 [https://github.com/brisa-build/brisa/compare/0.2.6...0.2.7](https://github.com/brisa-build/brisa/compare/0.2.6...0.2.7)

❤️ **Support Brisa:** [Visit our shop](https://brisadotbuild.myspreadshop.es/) for Brisa swag! 🛍️

<div align="center"> <a href="https://brisadotbuild.myspreadshop.es/" alt="Brisa Shop" target="_blank"> <img width="400" height="425" src="/images/blog-images/shop.webp" alt="Brisa Shop" /> </a> </div>
