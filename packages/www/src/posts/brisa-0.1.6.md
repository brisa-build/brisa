---
title: "Brisa 0.1.6"
created: 11/17/2024
description: "Brisa release notes for version 0.1.6"
author: Aral Roca
author_site: https://x.com/aralroca
---

This release focuses on addressing two critical regressions introduced in the previous versions:

## Select-Option bug 🐛

We have fixed a bug that caused the select-option default selected value to not be rendered correctly.

## Hot reload wasn’t feeling so "hot" 🥵

We have fixed some issues related to hot-reload that caused actions conflicts during hot-reload, and hot-reload was not working as expected.

## What's Changed

- **fix(hot-reload)**: fix actions conflicts during hot-reload + change transpilation phase – [@aralroca](https://github.com/aralroca) in [#633](https://github.com/brisa-build/brisa/pull/633)
- **refactor**: remove unnecessary clean of cache – [@aralroca](https://github.com/aralroca) in [#634](https://github.com/brisa-build/brisa/pull/634)
- **fix**: fix bug on select-option render – [@aralroca](https://github.com/aralroca) in [#635](https://github.com/brisa-build/brisa/pull/635)
- **fix(hot-reload)**: use cache only in prod – [@aralroca](https://github.com/aralroca) in [#636](https://github.com/brisa-build/brisa/pull/636)

**Full Changelog**: [https://github.com/brisa-build/brisa/compare/0.1.5...0.1.6](https://github.com/brisa-build/brisa/compare/0.1.5...0.1.6)
