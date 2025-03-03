---
title: "Brisa 0.2.8"
created: 03/03/2025
description: "Brisa release notes for version 0.2.8"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.8.webp
---

🚀 **Brisa v0.2.8 is here!** 🎉  

This release includes **new features, bug fixes, and a breaking change** in response headers handling. Let’s dive into what’s new!  

## ✨ New Features  

### **`useId` in RequestContext** 

Now available in `RequestContext`, expanding its usability to Server Components too (already existed for Web Components). – [@aralroca](https://github.com/aralroca) in [#770](https://github.com/brisa-build/brisa/pull/770)

The `useId` method generates a unique identifier for the server component. It is useful for creating unique keys for elements in lists or for other purposes that require unique identifiers, like Server Action IDs to use insie the [`indicate`](#indicate). The generated ID is unique across all server components and after re-renders on the server actions.

Example to identify server actions for the pending state:

```tsx
const id = useId();
const pending = indicate(`some-server-action-${id}`);
// ...
css`
 span { display: none }
 span.brisa-request { display: inline }
`
// ...
<>
  <button onClick={someAction} indicateClick={pending}>
    Run some action
  </button>
  <span indicator={pending}>Pending...</span>
</>
``` 

Docs: [`useId`](/api-reference/components/request-context.md#useid)

### **`headersSnapshot` in `responseHeaders` (BREAKING CHANGE)** 

Improves header management but requires adjustments in existing implementations. – [@aralroca](https://github.com/aralroca) in [#772](https://github.com/brisa-build/brisa/pull/772)  

The `responseHeaders` are in middleware, layout & page. We need to propagate accurately, and the `headersSnapshot` function is the new API that allows you to manage headers in a more predictable way.

#### Before (old API) 🟨

Previously, the function returned a plain object, which **merged** into existing headers _(unnecessary magic)_.

```ts
export function responseHeaders(req: RequestContext, responseStatus: number) {
  return {
    "Set-Cookie":  req.store.get("new-cookies"),
  };
}
```

#### Now (new API) 🟩

We've introduced `headersSnapshot()`, which **returns an immutable clone** of the current headers. You must return the modified headers explicitly.

```ts
export function responseHeaders(request: RequestContext, { headersSnapshot, responseStatus }: ResponseHeaders) {
  const headers = headersSnapshot();

  headers.append('Set-Cookies', request.store.get("new-cookies"))

  return headers;
}
```

#### 🔹 Alternative Usage: Passing `HeadersInit` to the Snapshot

You can pass a `HeadersInit` object to `headersSnapshot()` for convenience, automatically appending new entries:

```ts
export function responseHeaders(request, { headersSnapshot, responseStatus }) {
  return headersSnapshot({
    "Set-Cookies": request.store.get("new-cookies"),
  });
}
```

## 🐞 Bug Fixes  

- **Fixed "undefined" identifier issue** when transpiling actions. – [@aralroca](https://github.com/aralroca) in [#767](https://github.com/brisa-build/brisa/pull/767)  
- **Fixed function parameter identifiers** when transpiling actions. – [@aralroca](https://github.com/aralroca) in [#768](https://github.com/brisa-build/brisa/pull/768)  
- **Improved Server Actions registry** – Better performance and bug fixes. – [@aralroca](https://github.com/aralroca) in [#775](https://github.com/brisa-build/brisa/pull/775)  

## 📖 Documentation Updates  

- **Updated `headersSnapshot` docs** to clarify its usage. – [@aralroca](https://github.com/aralroca) in [#773](https://github.com/brisa-build/brisa/pull/773)  
- **Fixed minor documentation mistakes** for clarity. – [@aralroca](https://github.com/aralroca) in [#777](https://github.com/brisa-build/brisa/pull/777)  

## 🔄 Maintenance  

- **Upgraded Bun** to the latest version for better stability and performance. – [@aralroca](https://github.com/aralroca) in [#766](https://github.com/brisa-build/brisa/pull/766), [#776](https://github.com/aralroca) in [#776](https://github.com/brisa-build/brisa/pull/776)  
- **Upgraded TypeScript** to improve type safety and development experience. – [@aralroca](https://github.com/aralroca) in [#779](https://github.com/brisa-build/brisa/pull/779)  


## **Full Changelog**  

🔗 [https://github.com/brisa-build/brisa/compare/0.2.7...0.2.8](https://github.com/brisa-build/brisa/compare/0.2.7...0.2.8)  

❤️ **Support Brisa:** [Visit our shop](https://brisadotbuild.myspreadshop.es/) for Brisa swag! 🛍️  

<div align="center">  
<a href="https://brisadotbuild.myspreadshop.es/" alt="Brisa Shop" target="_blank">  
<img width="400" height="425" src="/images/blog-images/shop.webp" alt="Brisa Shop" />  
</a>  
</div>
