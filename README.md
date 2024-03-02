<p align="center">
  <a href="https://brisa.build">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/aralroca/brisa/assets/13313058/8c22bfcd-7eaf-42fd-b571-574067fa50ff" height="128">
      <img src="https://github.com/aralroca/brisa/assets/13313058/8c22bfcd-7eaf-42fd-b571-574067fa50ff" height="128">
    </picture>
    <h1 align="center">Brisa</h1>
  </a>
</p>


## Getting Started

## Who we are?

Brisa is an _(experimental)_ web framework inspired by the others, taking the best of each one.

### Documentation

The documentation will be soon on the [website](https://brisa.build/docs). For now it is not yet available and there is still a lot of documentation to be written, but you can access it from the [`/docs`](https://github.com/aralroca/brisa/tree/main/docs) directory of the GitHub repository.

### Inspirations

#### Bun.js

Bun.js makes it easy for many new frameworks to emerge thanks to its API such as the Next.js style page system, TypeScript support and JSX by default. Besides, it is super fast and the DX of working with it is awesome.

In Brisa we don't use Webpack, Turbopack, Vite or esbuild, we use directly [Bun.build](https://bun.sh/docs/bundler), which is faster than esbuild.

#### Next.js

Brisa's architecture is very much inspired by Next.js pages directory, the way of defining middleware, layout, etc, we have also expanded its model to define websockets and web components.

Although we like more how pages structures the files, also Next.js inspired us to use server components by default and server actions. 

#### React

Brisa was very inspired by React to work with JSX components, both for server components and web components. Our compiler transforms and optimizes the JSX in a different way so that writing web components is more React-like, and takes up much tiny than the original code.

#### Preact

The React team's focus on optimizing for small bundle code size motivated us to make Brisa 3kb as well. Although Brisa defaults to 0B, it is only 3kb if you use web components.

#### Solid.js

Solid.js here inspired us a lot with the signals. The idea that server components can react to web components through server actions and signals blew our minds, to the point that it motivated us to create the "action signals".

The way web components are reactive without needing Virtual DOM or rerendering greatly improves performance.

#### Qwik

The motivation to start with a new framework came from meeting Qwik. Misko came to Barcelona and talked about his baby, and I was motivated by Misko, Manu and Shai to talk about Qwik so I could also start creating my baby and try to make the web a little better.

The resumability concept has motivated us to load code like server actions when the user interacts. We can't say that we have resumability because the web components need to be hydrated, but the motivation to improve this in the future is still open.

#### Lit

Brisa was inspired by Lit to use the platform more. Today we have web components and there is [Declarative Shadow DOM](https://developer.chrome.com/docs/css-ui/declarative-shadow-dom), so we can SSR web components.

If well abstracted, the code of a web component can be smaller than using a library. Moreover, it also makes it easier to control when a prop changes, when it is unmounted and to have web components mixed with server components without problems.

We liked the idea of consuming web components as web components from JSX. That is, reading the code you know when a component is a server `<Server />` or when it is a web component `<web-component />`. We want developers to be able to easily distinguish the use of both.

The fact of using web components makes it more comfortable to debug the code as well, accessing directly to the web components from the DevTools elements, without any extension.

#### HTMX

HTMX has inspired Brisa to make the use of web components less and less necessary and the rest of the components are server components. Here we mix the concept of server actions with HTMX ideas such as indicators, debounce, etc.

Another thing that inspired us a lot is the fact of using more Hypermedia. Brisa's server actions respond with HTML that reactively updates the DOM. It also makes it easier to debug by looking at the Network tab in DevTools and see what the server action returns.

#### Tauri

In Brisa we wanted to make a direct integration with Tauri. So that from the Brisa configuration you can define the output: server (by default), static, desktop, android and ios, and the Brisa CLI will take care of the integration adding the necessary Tauri files that you can then modify if you want to change the icons, the title or use more native things.

#### Vue.js

Finally, I want to thank [An Phat](https://twitter.com/notphanan), a co-worker who is in the core team  of Vue.js and when he found out that I was starting to make a framework, he gave me a lot of support.

## License

MIT
