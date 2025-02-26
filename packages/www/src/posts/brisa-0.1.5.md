---
title: "Brisa 0.1.5"
created: 11/15/2024
description: "Brisa release notes for version 0.1.5"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.1.5.webp
---

In this release, we have focused on fixing issues and do some optimizations while we are defining and developing new features for the next releases. The only feature of this release is the extension of the SSR support of Web Components `self` variable.

The focus in the next releases is to improve our server output system so that the standalone build can have different forms: bundled (will greatly improve req/sec), bundled per route (will help integration with more cloud providers) and binary (will improve execution speed and memory in runtime). This process will help open many doors to new features and improvements in Brisa.

Thanks to all contibutors:

- [@gustavocadev](https://github.com/gustavocadev)
- [@AlbertSabate](https://github.com/AlbertSabate)
- [@aralroca](https://github.com/aralroca)

## Extend SSR support of WC self

The [`self` property](/api-reference/components/web-context#self) has been extended to work during the **Server-Side Rendering** (SSR):

- [`self.attachInternals()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/attachInternals) - You can use it at the top level that during the SSR ignores the method.
- [`self.shadowRoot.adoptedStyleSheets`](/building-your-application/styling/web-components#global-styles-in-web-components) - You can use it to clean global styles in web components and it works during the SSR.
- [`self.setAttribute()`](https://developer.mozilla.org/es/docs/Web/API/Element/getAttribute) - You can modify attributes of the web component during the SSR, for example to force a `tabindex` of an element without having to manually set it when consuming the web component.
- [`self.getAttribute()`](https://developer.mozilla.org/es/docs/Web/API/Element/setAttribute) - You can get attributes of the web component during the SSR. Brisa reactivity does not work here, but you can use it to get attribute values passed to the web component.
- [`self.addEventListener`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) - During the SSR, the execution will be ignored, but you can use it to register events at the top level of the web component where the subscription will be made on the client.
- [`self.removeEventListener`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener): During the SSR, the execution will be ignored, but you can use it to clean events at the top level of the web component where the cleanup will be done on the client.

Example:

```tsx
export default function WebComponent({}, { self, cleanup }) {
  const onClickToWC = () => {
    console.log("click");
  };

  // This is ignored during SSR, so you don't need an effect
  // TIP: Remember that thanks to signals Brisa only do the
  // render once
  self.addEventListener("click", onClickToWC);
  cleanup(() => {
    self.removeEventListener("click", onClickToWC);
  });

  return <div>Web Component</div>;
}
```

## Reduce 100B client size and improve performance +1K ops/sec

Fixing some issues, we have realized an improvement during the WC render process and we have done it.

We have reduced the client size by 100 bytes and improved the performance by +1K ops/sec by changing our render process of the web components.

## Better fine-graned Reactivity

We have improved the reactivity system to solve disconnected nodes on recursion with fragments. This will help to improve the performance of the reactivity system and avoid unexpected behaviors.

## Upgrade diff algorithm to fix various WC bugs

There were behaviors that sometimes the Web Components made a double rendering during navigation with SPA, and other strange behaviors that if the `onMount` function modified any attribute of the WC (`self.setAttribute`) then during the diffing it was overwritten. We have found the root of the problem and have solved both problems. So we have Brisa more stable every time. This diffing algorithm is public in another [library](https://github.com/aralroca/diff-dom-streaming) in case other frameworks want to implement HTML Streaming over the wire.

## Fix standalone build constants

Some constants were not being replaced in the standalone build, causing unexpected behaviors. This has been fixed in this release.

## Improve control of errors in `getServeOptions`

In the first implementation, the `getServeOptions` was something internal to Brisa, where the errors were displayed on the terminal, they were handled there. When we made this public API, we didn't take into account extracting the errors to be able to control them from the outside. Now, the errors are handled from the outside and can be controlled in a simpler way.

**And more... See the full changelog below:**

## What's Changed

- **fix**: improve errors in `getServeOptions` – [@aralroca](https://github.com/aralroca) in [#610](https://github.com/brisa-build/brisa/pull/610)
- **feat**: extend SSR support of WC self – [@aralroca](https://github.com/aralroca) in [#615](https://github.com/brisa-build/brisa/pull/615)
- **docs**: explain Brisa clustering vs PM2 – [@aralroca](https://github.com/aralroca) in [#616](https://github.com/brisa-build/brisa/pull/616)
- **chore**: skip GitHub Action for docs – [@aralroca](https://github.com/aralroca) in [#617](https://github.com/brisa-build/brisa/pull/617)
- **chore**: upgrade Bun – [@aralroca](https://github.com/aralroca) in [#619](https://github.com/brisa-build/brisa/pull/619)
- **fix**: upgrade diff algorithm to fix WC bugs #611 & #550 – [@aralroca](https://github.com/aralroca) in [#620](https://github.com/brisa-build/brisa/pull/620)
- **docs**: update return type – [@gustavocadev](https://github.com/gustavocadev) in [#621](https://github.com/brisa-build/brisa/pull/621)
- **fix**: improve locale detection from req – [@aralroca](https://github.com/aralroca) in [#623](https://github.com/brisa-build/brisa/pull/623)
- **fix(build)**: fix standalone var env – [@aralroca](https://github.com/aralroca) in [#624](https://github.com/brisa-build/brisa/pull/624)
- **chore**: bump tailwindcss to version alpha 33 – [@AlbertSabate](https://github.com/AlbertSabate) in [#625](https://github.com/brisa-build/brisa/pull/625)
- **perf**: reduce client size 100 bytes and improve +1K ops/sec – [@aralroca](https://github.com/aralroca) in [#626](https://github.com/brisa-build/brisa/pull/626)
- **fix(reactivity)**: solve disconnected nodes on recursion with fragments – [@aralroca](https://github.com/aralroca) in [#629](https://github.com/brisa-build/brisa/pull/629)
- **docs**: improve server actions docs – [@aralroca](https://github.com/aralroca) in [#630](https://github.com/brisa-build/brisa/pull/630)

## New Contributors

- [@gustavocadev](https://github.com/gustavocadev) made their first contribution in [#621](https://github.com/brisa-build/brisa/pull/621)

**Full Changelog**: [https://github.com/brisa-build/brisa/compare/0.1.4...0.1.5](https://github.com/brisa-build/brisa/compare/0.1.4...0.1.5)
