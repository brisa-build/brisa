---
title: "Brisa 0.2.9"
created: 03/18/2025
description: "Brisa release notes for version 0.2.9"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.9.webp
---

🚀 **Brisa v0.2.9 is here!** 🎉  

This update brings **new features, bug fixes, and documentation improvements**, including **CSS Modules support, sitemap compilation in dev mode, and improved security docs**. Let’s dive in!  

## ✨ New Features  

### **CSS Modules Support**  

Brisa now supports [**CSS Modules**](https://brisa.build/building-your-application/styling/css-modules), allowing for scoped styles without global conflicts. You can now import `.module.css` files inside your components.  

```tsx
import styles from './Button.module.css';

export function Button() {
  return <button class={styles.primary}>Click me</button>;
}
```

- **Added support for CSS Modules** – [@aralroca](https://github.com/aralroca) in [#791](https://github.com/brisa-build/brisa/pull/791)

### **Sitemap Compilation in Dev Mode**

The [**sitemap**](https://brisa.build/building-your-application/routing/sitemap#sitemap) is now compiled in development mode as well, ensuring that route changes are reflected properly while working locally.

- **Enabled sitemap compilation during development** – [@aralroca](https://github.com/aralroca) in [#787](https://github.com/brisa-build/brisa/pull/787)

## 🐞 Bug Fixes

- **Fixed CSS collision issues** between generated styles and existing public CSS files. – [@aralroca](https://github.com/aralroca) in [#781](https://github.com/brisa-build/brisa/pull/781)
- **Fixed render action dependencies** when using fragments. – [@aralroca](https://github.com/aralroca) in [#794](https://github.com/brisa-build/brisa/pull/794)

## 📖 Documentation Updates

- **Added CSRF Token documentation** to improve security awareness. – [@aralroca](https://github.com/aralroca) in [#792](https://github.com/brisa-build/brisa/pull/792)
- **Improved data fetching documentation** for better clarity. – [@aralroca](https://github.com/aralroca) in [#785](https://github.com/brisa-build/brisa/pull/785)
- **Fixed minor mistakes in documentation.** – [@aralroca](https://github.com/aralroca) in [#784](https://github.com/brisa-build/brisa/pull/784)


## 🔄 Maintenance

- **Upgraded dependencies** in `www`, Tailwind, and PandaCSS adapters. – [@aralroca](https://github.com/aralroca) in [#788](https://github.com/brisa-build/brisa/pull/788)
- **Upgraded Bun** to the latest version for better stability. – [@aralroca](https://github.com/aralroca) in [#790](https://github.com/brisa-build/brisa/pull/790)


## **Full Changelog**

🔗 [https://github.com/brisa-build/brisa/compare/0.2.8...0.2.9](https://github.com/brisa-build/brisa/compare/0.2.8...0.2.9)

---

## 🎙️ Listen to Brisa on JS Jabber!

Want to dive deeper into Brisa? Check out the latest episode of **JS Jabber Podcast**, where we discuss Brisa's philosophy, features, and its vision for the future of web development.

<iframe width="560" height="315" src="https://www.youtube.com/embed/vsZyogrdAhg" title="Brisa Presentation" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>