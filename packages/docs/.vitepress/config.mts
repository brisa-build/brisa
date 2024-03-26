import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "en-US",
  title: "Brisa Framework",
  ignoreDeadLinks: true,
  lastUpdated: true,
  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
  },
  description: "A documentation site for Brisa framework",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: "local",
    },
    logo: "/assets/brisa.svg",
    nav: [
      { text: "Home", link: "/" },
      {
        text: "Documentation",
        link: "/getting-started/quick-start",
      },
    ],
    sidebar: [
      {
        text: "🚀 Getting started",
        collapsed: true,
        items: [
          {
            text: "What is Brisa?",
            link: "/getting-started/what-is-brisa",
          },
          {
            text: "Quick Start",
            link: "/getting-started/quick-start",
          },
          {
            text: "Project structure",
            link: "/getting-started/project-structure",
          },
        ],
      },
      {
        text: "🛠️ Building your application",
        collapsed: false,
        items: [
          {
            text: "🛣️ Routing",
            collapsed: false,
            items: [
              {
                text: "Pages and Layouts",
                link: "/building-your-application/routing/pages-and-layouts",
              },
              {
                text: "Dynamic Routes",
                link: "/building-your-application/routing/dynamic-routes",
              },
              {
                text: "Linking and Navigating",
                link: "/building-your-application/routing/linking-and-navigating",
              },
              {
                text: "Custom error",
                link: "/building-your-application/routing/custom-error",
              },
              {
                text: "Api Routes",
                link: "/building-your-application/routing/api-routes",
              },
              {
                text: "Middleware",
                link: "/building-your-application/routing/middleware",
              },
              {
                text: "Authentication",
                link: "/building-your-application/routing/authenticating",
              },
              {
                text: "Internationalization",
                link: "/building-your-application/routing/internationalization",
              },
              {
                text: "Suspense and streaming",
                link: "/building-your-application/routing/suspense-and-streaming",
              },
              {
                text: "Websockets",
                link: "/building-your-application/routing/websockets",
              },
              {
                text: "Static assets",
                link: "/building-your-application/routing/static-assets",
              },
            ],
          },

          {
            text: "🧾 Components details",
            collapsed: true,
            items: [
              {
                text: "Server components",
                link: "/building-your-application/components-details/server-components",
              },
              {
                text: "Web components",
                link: "/building-your-application/components-details/web-components",
              },
              {
                text: "Context",
                link: "/building-your-application/components-details/context",
              },
              {
                text: "Forms",
                link: "/building-your-application/components-details/forms",
              },
              {
                text: "External libraries",
                link: "/building-your-application/components-details/external-libraries",
              },
            ],
          },
          {
            text: "📒 Data fetching",
            collapsed: true,
            items: [
              {
                text: "Fetching data",
                link: "/building-your-application/data-fetching/fetching",
              },
              {
                text: "Request context",
                link: "/building-your-application/data-fetching/request-context",
              },
              {
                text: "Web context",
                link: "/building-your-application/data-fetching/web-context",
              },
              {
                text: "Server actions",
                link: "/building-your-application/data-fetching/server-actions",
              },
            ],
          },
          {
            text: "💅 Styling",
            collapsed: true,
            items: [
              {
                text: "WIP",
                link: "/wip",
              },
            ],
          },
          {
            text: "⚙️ Configuring",
            collapsed: true,
            items: [
              {
                text: "Typescript",
                link: "/building-your-application/configuring/typescript",
              },
              {
                text: "Environment variables",
                link: "/building-your-application/configuring/environment-variables",
              },
              {
                text: "TLS",
                link: "/building-your-application/configuring/tls",
              },
              {
                text: "Zig Rust C files",
                link: "/building-your-application/configuring/zig-rust-c-files",
              },
              {
                text: "Trailing slash",
                link: "/building-your-application/configuring/trailing-slash",
              },
              {
                text: "Asset prefix",
                link: "/building-your-application/configuring/asset-prefix",
              },
              {
                text: "Plugins",
                link: "/building-your-application/configuring/plugins",
              },
              {
                text: "Output",
                link: "/building-your-application/configuring/output",
              },
              {
                text: "Content Security Policy",
                link: "/building-your-application/configuring/content-security-policy",
              },
              {
                text: "Debugging",
                link: "/building-your-application/configuring/debugging",
              },
            ],
          },
          {
            text: "🧪 Testing",
            collapsed: true,
            items: [
              {
                text: "WIP",
                link: "/wip",
              },
            ],
          },
          {
            text: "🔐 Authentication",
            collapsed: true,
            items: [
              {
                text: "WIP",
                link: "/wip",
              },
            ],
          },
          {
            text: "🚀 Deploying",
            collapsed: true,
            link: "/building-your-application/deploying/index",
            items: [
              {
                text: "Fly io",
                link: "/building-your-application/deploying/fly-io",
              },
              {
                text: "Vercel",
                link: "/building-your-application/deploying/vercel",
              },
              {
                text: "Netlify",
                link: "/building-your-application/deploying/netlify",
              },
              {
                text: "AWS",
                link: "/building-your-application/deploying/aws",
              },
              {
                text: "Render com",
                link: "/building-your-application/deploying/render-com",
              },
              {
                text: "Docker",
                link: "/building-your-application/deploying/docker",
              },
              {
                text: "Static exports",
                link: "/building-your-application/deploying/static-exports",
              },
              {
                text: "Desktop app",
                link: "/building-your-application/deploying/desktop-app",
              },
              {
                text: "Android app",
                link: "/building-your-application/deploying/android-app",
              },
              {
                text: "iOS app",
                link: "/building-your-application/deploying/ios-app",
              },
            ],
          },
        ],
      },
      {
        text: "⚙️ API Reference",
        link: "/api-reference/index",
        collapsed: false,
        items: [
          {
            text: "🧩 Components",
            collapsed: true,
            items: [
              {
                text: "Context provider",
                link: "/api-reference/components/context-provider",
              },
            ],
          },
          {
            collapsed: false,
            text: "🗜️ Functions",
            items: [
              {
                text: "createContext",
                link: "/api-reference/functions/createContext",
              },
              {
                text: "createPortal",
                link: "/api-reference/functions/createPortal",
              },
              {
                text: "dangerHTML",
                link: "/api-reference/functions/dangerHTML",
              },
              {
                text: "navigate",
                link: "/api-reference/functions/navigate",
              },
              {
                text: "notFound",
                link: "/api-reference/functions/notFound",
              },
            ],
          },
          {
            collapsed: true,
            text: "📚 Extended HTML Attributes",
            items: [
              {
                text: "debounceEvent",
                link: "/api-reference/extended-html-attributes/debounceEvent",
              },
              {
                link: "/api-reference/extended-html-attributes/indicateEvent",
                text: "indicateEvent",
              },
              {
                link: "/api-reference/extended-html-attributes/key",
                text: "key",
              },
              {
                link: "/api-reference/extended-html-attributes/ref",
                text: "ref",
              },
              {
                link: "/api-reference/extended-html-attributes/serverOnly",
                text: "serverOnly",
              },
              {
                link: "/api-reference/extended-html-attributes/skipSSR",
                text: "skipSSR",
              },
            ],
          },
          {
            collapsed: true,
            text: "🔧 Macros",
            items: [
              {
                text: "prerender",
                link: "/api-reference/macros/prerender",
              },
            ],
          },
          {
            collapsed: true,
            text: "🌐 Server APIs",
            items: [
              {
                text: "rerenderInAction",
                link: "/api-reference/server-apis/rerenderInAction",
              },
              {
                text: "renderToReadableStream",
                link: "/api-reference/server-apis/renderToReadableStream",
              },
              {
                text: "renderToString",
                link: "/api-reference/server-apis/renderToString",
              },
            ],
          },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/brisa-build/brisa" },
      { icon: "twitter", link: "https://twitter.com/brisadotbuild" },
      { icon: "discord", link: "https://discord.com/invite/89Y9HMYZ" },
    ],
    editLink: {
      text: "Edit this page on GitHub",
      pattern:
        "https://github.com/brisa-build/brisa/tree/main/packages/docs/:path",
    },
  },
});
