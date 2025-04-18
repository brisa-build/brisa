---
title: "Brisa 0.2.11"
created: 04/18/2025
description: "Brisa release notes for version 0.2.11"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.11.webp
---

🚀 **Brisa v0.2.11 is out!**  
This release continues the journey toward full **static build optimization** and better **i18n + RPC** coordination during navigation. It includes **important fixes, quality-of-life improvements, and a few internal upgrades**.

## ⚙️ Build Improvements

- **Static Imports for API Endpoints**  
    Dynamic imports are replaced with static ones, in line with our binary compilation roadmap.  
    → [#831](https://github.com/brisa-build/brisa/pull/831)
    
- **Upgraded Bun & Tailwind Adapter**  
    Ensures better compatibility and performance.  
    → [#828](https://github.com/brisa-build/brisa/pull/828), [#839](https://github.com/brisa-build/brisa/pull/839), [#846](https://github.com/brisa-build/brisa/pull/846)
    

## 🌍 i18n & RPC Fixes

- **Better i18n Script Handling**  
    The script now loads in `<head>`, improving stability during SSR & hydration.  
    → [#829](https://github.com/brisa-build/brisa/pull/829)
    
- **Fixes with Regex-based i18n Keys**  
    Proper extraction when using dynamic patterns.  
    → [#838](https://github.com/brisa-build/brisa/pull/838)
    
- **Proper Script Ordering for SPA Navigation**  
    Ensures RPC works reliably during client-side navigation.  
    → [#834](https://github.com/brisa-build/brisa/pull/834), [#835](https://github.com/brisa-build/brisa/pull/835)
    

## 💠 Web Component Enhancements

- **Improved Attribute Handling**  
    Now supports **kebab-case** and **snake_case** for reactive props.  
    → [#844](https://github.com/brisa-build/brisa/pull/844), [#845](https://github.com/brisa-build/brisa/pull/845)
    

## 🧹 Misc

- **Diffing Algorithm Tweaks** for future improvements – [#836](https://github.com/brisa-build/brisa/pull/836)
    
- **`@tailwindcss/oxide`** marked as external for standalone builds – [#842](https://github.com/brisa-build/brisa/pull/842)
    

## 🔗 Full Changelog

[Compare 0.2.10 → 0.2.11](https://github.com/brisa-build/brisa/compare/0.2.10...0.2.11)

❤️ Love Brisa? [Get some swag](https://brisadotbuild.myspreadshop.es/) or support the project by sharing!
