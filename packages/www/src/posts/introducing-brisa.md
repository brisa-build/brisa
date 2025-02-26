---
title: "Introducing Brisa: Full-stack Web Platform Framework"
created: 10/05/2024
description: "Brisa is a full-stack framework that allows you to mix Server Components + Server Actions with Web Components + Signals, both wrote in JSX."
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/new_framework.png
---

Today I’m excited to publicly share Brisa: A full-stack framework that allows you to mix [Server Components](https://brisa.build/building-your-application/components-details/server-components) + [Server Actions](https://brisa.build/building-your-application/data-management/server-actions) with [Web Components](https://brisa.build/building-your-application/components-details/web-components) + [Signals](https://brisa.build/building-your-application/components-details/reactivity), both written in JSX. Including:

- **SSR**: Pages entry points are rendered on the server and streamed to the client, including SSR of Web Components using the Declarative Shadow DOM under the hood.
- **Static site generation**: You can generate static pages on build-time, and even mix them with dynamic pages.
- **Partial pre-rendering**: You can pre-render specific page components on build-time meanwhile the rest of the page is rendered on the server.
- **Reactivity**: Web Components props _("attributes")_ and state are 100% reactive thanks to Signals. The advantage is that the props are optimized in build-time so you can write them as in frameworks like React to control their default values, do destructuring, etc. without losing reactivity.
- **Fully-Featured:**: Brisa supports TypeScript, CSS, Tailwind, PandaCSS, Middleware, API Routes, Internationalization (routing + translations), Web Sockets, Suspense, Server Actions, Testing, Tauri 2.x, and more.
- **Unified tooling**: Apart from Brisa, you need Bun to manage all the tooling. We don't like that you have the package.json with many libraries. Brisa enriches Bun testing by adding matchers and you don't need Webpack, Vite, because we do it with Bun too. Although we like Bun and also recommend it as runtime, you can use Node.js as runtime if you want. A Perfect Stack is the 3B Stack: Brisa + Bun + Biome.
- **HTML Streaming over the wire**: The current frameworks need to interact with the server actions that the request returns JS or JSON and make workarounds to manage the streaming. When HTTP is invented to transfer HTML. In Brisa, we transfer HTML in streaming and the Web Components react to changes in their attributes or new ideas like “Action Signals”, where from the server action you can make the Web Components react without needing a re-render in the server.

> **Check** [**Brisa 0.1 Release Notes**](https://github.com/brisa-build/brisa/releases/tag/0.1.0)

To build a very fast website, there is a simple secret; bring as little JS code as possible to the client. Using the Web Platform as much as possible avoids having to bring unnecessary things to the client. However, to get the most out of it, we need to know how to differentiate user interactions. There are interactions where the server is involved, and there are those that are not. For example, in an ecommerce, many of the actions are server-side, like adding an item in the cart, so we need to add client code for a list of products? We answer quickly: no.

One goal of Brisa is to end up coupling as much as possible to the Web Platform, but only when necessary. Because the other goal is that you can create an SPA without needing any Web Component and JS code on the client, thanks to server actions and ideas from HTMX where you can debounce and pending states without adding code to the client. The Web platform is so powerful that we bring it to the server, where all the events of DOM elements can be captured by a server action, and propagated on the server.

These days in X (formelly Twitter), there has been a lot of discussion that Web Components take more code and worse performance than frameworks, let's believe that in Brisa we have broken this barrier. If you decide to use Web Components in Brisa, it comes with the Brisa wrapper which is 3 KB including signals (Preact is 3kb, but if you need signals you have to add more packages). And in Brisa instead of JSX-runtime for web components we use JSX-buildtime, to make optimizations to make your Web Components very small.

Example of a Counter Web Component in Brisa:

```tsx
import type { WebContext } from "brisa";

export default function Counter(
  { name }: { name: string },
  { state }: WebContext,
) {
  const count = state(0);

  return (
    <p>
      <button onClick={() => count.value++}>+</button>
      <span>
        {" "}
        {name} {count.value}{" "}
      </span>
      <button onClick={() => count.value--}>-</button>
    </p>
  );
}
```

And this is the compiled code **without minify**:

```ts
import { brisaElement } from "brisa/client";
function Counter({ name }, { state }) {
  const count = state(0);
  return [
    "p",
    {},
    [
      [
        "button",
        {
          onClick: () => count.value++,
        },
        "+",
      ],
      [
        "span",
        {},
        [
          [null, {}, " "],
          [null, {}, () => name.value],
          [null, {}, " "],
          [null, {}, () => count.value],
          [null, {}, " "],
        ],
      ],
      [
        "button",
        {
          onClick: () => count.value--,
        },
        "-",
      ],
    ],
  ];
}
export default brisaElement(Counter, ["name"]);
```

And there are neither: re-renders nor virtualDOM. Reactivity works well in both frameworks and Web Components, there is no difference in this performance issue.

By using the platform, we can control the signals and clean them inside the Web Component efficiently. We also don't need extra JS client code to manage the server actions, just a small 2kb RPC that is only added when using Signals.

And... We have gone further. We believe that the **internationalization** nowadays that there are two worlds (server/client) the best way to make it efficient is to be fully integrated with the framework, so we have done it:

- **Routing**: This part works the same as other frameworks such as Next.js.
- **Translations**: It uses ECMAScript Intl along with an 800 B implementation that is only brought to the client if you use it within Web Components. Intelligently in build-time, it knows which keys to take to the client, so if you have a dictionary of 1000 words, and you only consume one in a Web Component and the rest in the server components, it will only take 1 word to the client.
- **I18n path names resolution**: Brisa allows you to translate path names, `/en/about-us` you can translate to `/es/sobre-nosotros` in Spanish. It also manages `hreflang`s and `lang` attributes automatically to improve SEO and accessibility.

Do you dare to try it? Try our [Playground](https://brisa.build/playground) or see the [documentation](https://brisa.build/getting-started/quick-start) on how to get started with Brisa to test it on your machine.

## Community

Brisa is a community-driven project. We are committed to building a diverse and inclusive community. We welcome all ideas and backgrounds. We are committed to providing a friendly, safe, and welcoming environment for everyone. Please read and follow our [Code of Conduct](https://github.com/brisa-build/brisa/blob/main/CODE_OF_CONDUCT.md) to help us achieve this.

The first months after 0.1 we will be fixing issues and collecting suggestions and feature ideas to finish building the 1.0 route-map together with the community. For now we have some clear ideas: more runtime-agnostic (Deno), more optimizations, CSS Modules. But we prefer to listen to the community and evolve well.

To help you contribute, we will be giving away free Brisa T-shirts to contributors. Until when? Until the current stock runs out. Take advantage of October to get 2 t-shirts by contributing to Brisa, the Hacktoberfest one and the Brisa one.

## Long-Term Sustainability

**Brisa is and always will be free**. It is an open-source project released under the [MIT license](https://github.com/brisa-build/brisa/blob/main/LICENSE).

We care deeply about building a more sustainable future for open-source software. At the same time, we need to support Brisa's development long-term. This requires money (donations alone aren’t enough). We are going to publish our **Open Collective** soon, where you can support us with your company or as an individual. For now, you can <a href="javascript:document.querySelector('#MERGE0').focus()">Subscribe to the Newsletter</a> to be informed about the Open-Collective launch.

## More

- [Brisa 0.1 Release Notes](https://github.com/brisa-build/brisa/releases/tag/0.1.0)
- [Routemap 0.1](https://github.com/brisa-build/brisa/issues/1)
- [Next Routemap v1.0 (WIP)](https://github.com/brisa-build/brisa/issues/197)
- [Brisa Documentation](https://brisa.build/getting-started/quick-start)
- [Brisa Playground](https://brisa.build/playground)
- [Brisa GitHub](https://github.com/brisa-build/brisa)
- [X (Twitter)](https://x.com/brisadotbuild)
- [Discord](https://discord.com/invite/MsE9RN3FU4)
