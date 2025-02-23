---
title: "Brisa 0.2.1"
created: 12/18/2024
description: "Brisa release notes for version 0.2.1"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.2.1.webp
---

Brisa 0.2.1 introduces flexible rendering APIs, post-response hooks, and encryption utilities, along with essential bug fixes to streamline your development workflow.

Thanks to contributors:

- **[@kentcdodds](https://github.com/kentcdodds)**
- **[@aralroca](https://github.com/aralroca)**

By the way, glad **Brisa** is in one of the [**conclusions** of the **state of JS 2024**](https://2024.stateofjs.com/en-US/conclusion/)! It's time for the community to grow! 🚀

## 🆕 New Features

### **1. Enhanced Rendering on Server Actions**
The `rerenderInAction` function has been replaced with more flexible APIs:
- [**`renderPage`**](/api-reference/server-apis/renderPage): Re-renders the full page.
- [**`renderComponent`**](/api-reference/server-apis/renderComponent): Re-renders the target component or a specific component to a specific location.

**🚨 BREAKING CHANGE**: The `rerenderInAction` function has been removed. Use `renderPage` and `renderComponent` instead.

<div align="center">
<iframe width="560" height="315" src="https://www.youtube.com/embed/7kwT1oshUJA" title="Server-Side Dialog Management: No Browser JavaScript Required" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

Apart from replacing it, as a novelty, any component can be rendered in any location. 

The YouTube video demonstrates how to render and manage a modal's open/close actions using server-side functionality exclusively ([See code example](https://github.com/brisa-build/brisa/tree/canary/examples/with-ssr-modal)). Our goal is to enable the creation of a single-page application (SPA) without adding client-side code, keeping your project lightweight with just the 2KB required for the RPC communication.

This feature gives much more power, besides it works with streaming, you can use an [async generator](/building-your-application/data-management/fetching#async-generators) to control better the stream chunks if you want:


```tsx
import { Database } from "bun:sqlite";
import { renderComponent } from "brisa/server";

export default function LoadMovies() {
  function streamMovies() {
    renderComponent({
      element: <MovieItems />,
      target: "ul",
      placement: "append",
    });
  }

  return (
    <>
      <button id="movies" onClick={streamMovies}>
        Click here to stream movies from a Server Action
      </button>
      <ul />
    </>
  )
}

const db = new Database("db.sqlite");

async function* MovieItems() {
  for (const movie of db.query("SELECT title, year FROM movies")) {
    yield (
      <li>
        {movie.title} ({movie.year})
      </li>
    );
  }
}
```

### **2. `after` Request Context Method**

A new [`after`](/api-reference/components/request-context#after) method has been added to the request context, enabling you to schedule work to be executed after a response (or prerender) is finished. This is useful for tasks and other side effects that should not block the response, such as logging and analytics.

It can be used everywhere when you have access to the `RequestContext` (Middleware, API routes, Server components, etc).

Example:

```tsx
import { type RequestContext } from "brisa";

export default function SomeComponent({}, { after }: RequestContext) {
  after(() => {
    console.log("The response is sent");
  });

  return <div>Some content</div>;
}
```

### **3. Encryption and Decryption Utilities**

Introducing new [`encrypt`](/api-reference/server-apis/encrypt) and [`decrypt`](/api-reference/server-apis/decrypt) functions to simplify data security and management.

Brisa, unlike other frameworks that encrypt all external variables used in server actions by default, which has a high computational cost when rendering the page, we prefer that the developer decide which data needs to be encrypted and decrypted to consume within a Server Action.

In this version, we have added two functions to encrypt and decrypt data easily:

```tsx 11
import { encrypt, decrypt } from "brisa/server";

// ...
<button
  onClick={(e) => {
    // Decrypt on the server action:
    console.log(
      decrypt(e.target.dataset.encrypted)
    )
  }}
  data-encrypted={encrypt("some sensible data")}
>
  Click to recover sensible data on the server
</button>
```

## 🐞 Bug Fixes

- **`navigate`**: Fixed navigation to the current locale.
- **`userEvent.select` and `deselect`**: Fixed to work in new versions of Happy DOM.
- **`build`**: Fixed transpilation of actions with nested inner function dependencies.



## 📝 What's Changed

- **docs**: move decrement to the left side – [@kentcdodds](https://github.com/kentcdodds) in [#673](https://github.com/brisa-build/brisa/pull/673)
- **docs**: fix code example – [@aralroca](https://github.com/aralroca) in [#674](https://github.com/brisa-build/brisa/pull/674)
- **feat**: add `after` request context method – [@aralroca](https://github.com/aralroca) in [#677](https://github.com/brisa-build/brisa/pull/677)
- **feat**: add encrypt and decrypt functions – [@aralroca](https://github.com/aralroca) in [#679](https://github.com/brisa-build/brisa/pull/679)
- **fix**: fix userEvent.select and deselect to work in new versions of happy-dom – [@aralroca](https://github.com/aralroca) in [#681](https://github.com/brisa-build/brisa/pull/681)
- **feat**: replace `rerenderInAction` to `renderPage` and `renderComponent` – [@aralroca](https://github.com/aralroca) in [#682](https://github.com/brisa-build/brisa/pull/682)
- **feat(example)**: add SSR dialog control example – [@aralroca](https://github.com/aralroca) in [#683](https://github.com/brisa-build/brisa/pull/683)
- **fix(build)**: fix transpilation of actions with nested inner function deps – [@aralroca](https://github.com/aralroca) in [#685](https://github.com/brisa-build/brisa/pull/685)
- **fix(navigate)**: fix navigate to current locale – [@aralroca](https://github.com/aralroca) in [#687](https://github.com/brisa-build/brisa/pull/687)
- **chore**: upgrade to Bun 1.1.40 – [@aralroca](https://github.com/aralroca) in [#689](https://github.com/brisa-build/brisa/pull/689)

---

## 🙌 New Contributors

- **[@kentcdodds](https://github.com/kentcdodds)** made their first contribution in [#673](https://github.com/brisa-build/brisa/pull/673)

---

**Full Changelog**: [https://github.com/brisa-build/brisa/compare/0.2.0...0.2.1](https://github.com/brisa-build/brisa/compare/0.2.0...0.2.1)

---

**Support Us:** [Visit our shop](https://brisadotbuild.myspreadshop.es/) for Brisa swag! 🛍️


<div align="center">
<a href="https://brisadotbuild.myspreadshop.es/" alt="Brisa Shop" target="_blank">
<img width="400" height="425" src="/images/blog-images/shop.webp" alt="Brisa Shop" />
</a>
</div>
