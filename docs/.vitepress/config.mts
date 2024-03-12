import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "en-US",
  title: "Brisa Documentation",
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
    logo: "brisa.svg",
    nav: [
      { text: "Home", link: "/", activeMatch: "^/$|^/guide/" },
      {
        text: "Documentation",
        link: "01-getting-started/01-installation.md",
      },
    ],
    sidebar: [
      {
        text: "🚀 Getting started",
        collapsed: true,
        items: [
          {
            text: "Installation",
            link: "01-getting-started/01-installation.md",
          },
          {
            text: "Project structure",
            link: "01-getting-started/02-project-structure.md",
          },
          { text: "index", link: "01-getting-started/index.md" },
        ],
      },
      {
        text: "🛠️ Building your application",
        collapsed: false,
        items: [
          {
            text: "🛣️ Routing",
            items: [
              {
                text: "Pages and Layouts",
                link: "02-building-your-application/01-routing/01-pages-and-layouts.md",
              },
              {
                text: "Dynamic Routes",
                link: "02-building-your-application/01-routing/02-dynamic-routes.md",
              },
              {
                text: "Linking and Navigating",
                link: "02-building-your-application/01-routing/03-linking-and-navigating.md",
              },
              {
                text: "Custom error",
                link: "02-building-your-application/01-routing/04-custom-error.md",
              },
              {
                text: "Api Routes",
                link: "02-building-your-application/01-routing/05-api-routes.md",
              },
              {
                text: "Middleware",
                link: "02-building-your-application/01-routing/06-middleware.md",
              },
              {
                text: "Authentication",
                link: "02-building-your-application/01-routing/07-authenticating.md",
              },
              {
                text: "Internationalization",
                link: "02-building-your-application/01-routing/08-internationalization.md",
              },
              {
                text: "Suspense and streaming",
                link: "02-building-your-application/01-routing/09-suspense-and-streaming.md",
              },
              {
                text: "Websockets",
                link: "02-building-your-application/01-routing/10-websockets.md",
              },
            ],
          },

          {
            text: "🧾 Components details",
            collapsed: true,
            items: [
              {
                text: "Server components",
                link: "02-building-your-application/02-components-details/01-server-components.md",
              },
              {
                text: "Web components",
                link: "02-building-your-application/02-components-details/02-web-components.md",
              },
              {
                text: "Context",
                link: "02-building-your-application/02-components-details/03-context.md",
              },
              {
                text: "Forms",
                link: "02-building-your-application/02-components-details/04-forms.md",
              },
              {
                text: "External libraries",
                link: "02-building-your-application/02-components-details/05-external-libraries.md",
              },
            ],
          },
          {
            text: "📒 Data fetching",
            collapsed: true,
            items: [
              {
                text: "Fetching data",
                link: "02-building-your-application/03-data-fetching/01-fetching.md",
              },
              {
                text: "Request context",
                link: "02-building-your-application/03-data-fetching/02-request-context.md",
              },
              {
                text: "Web context",
                link: "02-building-your-application/03-data-fetching/03-web-context.md",
              },
              {
                text: "Server actions",
                link: "02-building-your-application/03-data-fetching/04-server-actions.md",
              },
            ],
          },
          {
            text: "💅 Styling",
            collapsed: true,
            items: [
              {
                text: "Fetching data",
                link: "TODO",
              },
            ],
          },
          {
            text: "⚙️ Configuring",
            collapsed: true,
            items: [
              {
                text: "Typescript",
                link: "02-building-your-application/06-configuring/01-typescript.md",
              },
              {
                text: "Environment variables",
                link: "02-building-your-application/06-configuring/02-environment-variables.md",
              },
              {
                text: "TLS",
                link: "02-building-your-application/06-configuring/03-tls.md",
              },
              {
                text: "Zig Rust C files",
                link: "02-building-your-application/06-configuring/04-zig-rust-c-files.md",
              },
              {
                text: "Trailing slash",
                link: "02-building-your-application/06-configuring/05-trailing-slash.md",
              },
              {
                text: "Asset prefix",
                link: "02-building-your-application/06-configuring/06-asset-prefix.md",
              },
              {
                text: "Plugins",
                link: "02-building-your-application/06-configuring/07-plugins.md",
              },
              {
                text: "Output",
                link: "02-building-your-application/06-configuring/08-output.md",
              },
              {
                text: "Content Security Policy",
                link: "02-building-your-application/06-configuring/09-content-security-policy.md",
              },
              {
                text: "Debugging",
                link: "02-building-your-application/06-configuring/13-debugging.md",
              },
            ],
          },
          {
            text: "🧪 Testing",
            collapsed: true,
            items: [
              {
                text: "Fetching data",
                link: "TODO",
              },
            ],
          },
          {
            text: "🔐 Authentication",
            collapsed: true,
            items: [
              {
                text: "Fetching data",
                link: "TODO",
              },
            ],
          },
          {
            text: "🚀 Deploying",
            collapsed: true,
            items: [
              {
                text: "Fly io",
                link: "02-building-your-application/09-deploying/01-fly-io.md",
              },
              {
                text: "Vercel",
                link: "02-building-your-application/09-deploying/02-vercel.md",
              },
              {
                text: "Netlify",
                link: "02-building-your-application/09-deploying/03-netlify.md",
              },
              {
                text: "AWS",
                link: "02-building-your-application/09-deploying/04-aws.md",
              },
              {
                text: "Render com",
                link: "02-building-your-application/09-deploying/05-render-com.md",
              },
              {
                text: "Docker",
                link: "02-building-your-application/09-deploying/06-docker.md",
              },
              {
                text: "Static exports",
                link: "02-building-your-application/09-deploying/07-static-exports.md",
              },
              {
                text: "Tauri",
                link: "02-building-your-application/09-deploying/08-tauri.md",
              },
            ],
          },
        ],
      },
      {
        text: "⚙️ API Reference",
        link: "03-api-reference/index.md",
        collapsed: false,
        items: [
          {
            text: "🧩 Components",
            collapsed: true,
            items: [
              {
                text: "Context provider",
                link: "03-api-reference/01-components/context-provider.md",
              },
            ],
          },
          {
            collapsed: false,
            text: "🗜️ Functions",
            items: [
              {
                text: "createContext",
                link: "03-api-reference/02-functions/createContext.md",
              },
              {
                text: "createPortal",
                link: "03-api-reference/02-functions/createPortal.md",
              },
              {
                text: "dangerHTML",
                link: "03-api-reference/02-functions/dangerHTML.md",
              },
              {
                text: "navigate",
                link: "03-api-reference/02-functions/navigate.md",
              },
              {
                text: "notFound",
                link: "03-api-reference/02-functions/notFound.md",
              },
              {
                text: "rerenderInAction",
                link: "03-api-reference/02-functions/rerenderInAction.md",
              },
            ],
          },
          {
            collapsed: true,
            text: "📚 Extended HTML Attributes",
            items: [
              {
                text: "debounceEvent",
                link: "03-api-reference/03-extended-html-attributes/debounceEvent.md",
              },
              {
                link: "03-api-reference/03-extended-html-attributes/indicateEvent.md",
                text: "indicateEvent",
              },
              {
                link: "03-api-reference/03-extended-html-attributes/key.md",
                text: "key",
              },
              {
                link: "03-api-reference/03-extended-html-attributes/ref.md",
                text: "ref",
              },
              {
                link: "03-api-reference/03-extended-html-attributes/serverOnly.md",
                text: "serverOnly",
              },
              {
                link: "03-api-reference/03-extended-html-attributes/skipSSR.md",
                text: "skipSSR",
              },
            ],
          },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/aralroca/brisa" },
      { icon: "twitter", link: "https://twitter.com/brisadotbuild" },
      { icon: "discord", link: "https://discord.com/invite/89Y9HMYZ" },
    ],
    editLink: {
      text: "Edit this page on GitHub",
      pattern:
        "https://github.com/aralroca/brisa/documentation/edit/main/:path",
    },
  },
});
