import type { Config } from '@/types';

export default {
  sidebar: [
    {
      text: '🚀 Getting started',
      id: '/getting-started',
      collapsed: false,
      items: [
        {
          text: 'What is Brisa?',
          link: '/getting-started/what-is-brisa',
        },
        {
          text: 'Quick Start',
          link: '/getting-started/quick-start',
        },
        {
          text: 'Project structure',
          link: '/getting-started/project-structure',
        },
      ],
    },
    {
      text: '🛠️ Building your application',
      id: '/building-your-application',
      collapsed: false,
      items: [
        {
          text: '🛣️ Routing',
          collapsed: false,
          id: '/building-your-application/routing',
          items: [
            {
              text: 'Pages and Layouts',
              link: '/building-your-application/routing/pages-and-layouts',
            },
            {
              text: 'Dynamic Routes',
              link: '/building-your-application/routing/dynamic-routes',
            },
            {
              text: 'Linking and Navigating',
              link: '/building-your-application/routing/linking-and-navigating',
            },
            {
              text: 'Custom error',
              link: '/building-your-application/routing/custom-error',
            },
            {
              text: 'Api Routes',
              link: '/building-your-application/routing/api-routes',
            },
            {
              text: 'Middleware',
              link: '/building-your-application/routing/middleware',
            },
            {
              text: 'Internationalization',
              link: '/building-your-application/routing/internationalization',
            },
            {
              text: 'Suspense and streaming',
              link: '/building-your-application/routing/suspense-and-streaming',
            },
            {
              text: 'Websockets',
              link: '/building-your-application/routing/websockets',
            },
            {
              text: 'Static assets',
              link: '/building-your-application/routing/static-assets',
            },
            {
              text: 'Sitemap',
              link: '/building-your-application/routing/sitemap',
            },
          ],
        },

        {
          text: '🧾 Components details',
          id: '/building-your-application/components-details',
          items: [
            {
              text: 'Server components',
              link: '/building-your-application/components-details/server-components',
            },
            {
              text: 'Web components',
              link: '/building-your-application/components-details/web-components',
            },
            {
              text: 'Reactivity',
              link: '/building-your-application/components-details/reactivity',
            },
            {
              text: 'Context',
              link: '/building-your-application/components-details/context',
            },
            {
              text: 'Forms',
              link: '/building-your-application/components-details/forms',
            },
            {
              text: 'External libraries',
              link: '/building-your-application/components-details/external-libraries',
            },
          ],
        },
        {
          text: '📒 Data management',
          id: '/building-your-application/data-management',
          items: [
            {
              text: 'Fetching data',
              link: '/building-your-application/data-management/fetching',
            },
            {
              text: 'Server actions (mutations)',
              link: '/building-your-application/data-management/server-actions',
            },
          ],
        },
        {
          text: '💅 Styling',
          id: '/building-your-application/styling',
          link: '/building-your-application/styling',
          items: [
            {
              text: 'Global styles',
              link: '/building-your-application/styling/global-styles',
            },
            {
              text: 'CSS Template literal',
              link: '/building-your-application/styling/css-template-literal',
            },
            {
              text: 'CSS inlined in JSX',
              link: '/building-your-application/styling/css-inlined-in-jsx',
            },
            {
              text: 'Tailwind CSS',
              link: '/building-your-application/styling/tailwind-css',
            },
            {
              text: 'Panda CSS',
              link: '/building-your-application/styling/panda-css',
            },
            {
              text: 'Styling Web Components',
              link: '/building-your-application/styling/web-components',
            },
          ],
        },
        {
          text: '⚙️ Configuring',
          id: '/building-your-application/configuring',
          items: [
            {
              text: 'brisa.config.js options',
              link: '/building-your-application/configuring/brisa-config-js',
            },
            {
              text: 'Typescript',
              link: '/building-your-application/configuring/typescript',
            },
            {
              text: 'Environment variables',
              link: '/building-your-application/configuring/environment-variables',
            },
            {
              text: 'TLS',
              link: '/building-your-application/configuring/tls',
            },
            {
              text: 'Zig Rust C files',
              link: '/building-your-application/configuring/zig-rust-c-files',
            },
            {
              text: 'Trailing slash',
              link: '/building-your-application/configuring/trailing-slash',
            },
            {
              text: 'Asset compression',
              link: '/building-your-application/configuring/asset-compression',
            },
            {
              text: 'Asset prefix',
              link: '/building-your-application/configuring/asset-prefix',
            },
            {
              text: 'Base path',
              link: '/building-your-application/configuring/base-path',
            },
            {
              text: 'Plugins',
              link: '/building-your-application/configuring/plugins',
            },
            {
              text: 'Output',
              link: '/building-your-application/configuring/output',
            },
            {
              text: 'Output Adapter',
              link: '/building-your-application/configuring/output-adapter',
            },
            {
              text: 'Integrations',
              link: '/building-your-application/configuring/integrations',
            },
            {
              text: 'External dependencies',
              link: '/building-your-application/configuring/external',
            },
            {
              text: 'Idle timeout',
              link: '/building-your-application/configuring/idle-timeout',
            },
            {
              text: 'Static pages',
              link: '/building-your-application/configuring/static-pages',
            },
            {
              text: 'Clustering',
              link: '/building-your-application/configuring/clustering',
            },
            {
              text: 'Filter runtime dev errors',
              link: '/building-your-application/configuring/filter-runtime-dev-errors',
            },
            {
              text: 'Content Security Policy',
              link: '/building-your-application/configuring/content-security-policy',
            },
            {
              text: 'Custom Server',
              link: '/building-your-application/configuring/custom-server',
            },
            {
              text: 'Debugging',
              link: '/building-your-application/configuring/debugging',
            },
          ],
        },
        {
          text: '🧪 Testing',
          id: '/building-your-application/testing',
          items: [
            {
              text: 'Introduction',
              link: '/building-your-application/testing/introduction',
            },
            {
              text: 'Matchers',
              link: '/building-your-application/testing/matchers',
            },
            {
              text: 'Test API',
              link: '/building-your-application/testing/test-api',
            },
          ],
        },
        {
          text: '🔐 Authentication',
          id: '/building-your-application/authentication',
          link: '/building-your-application/authentication',
          items: [
            {
              text: 'Authentication',
              link: '/building-your-application/authentication/authentication',
            },
            {
              text: 'Authorization',
              link: '/building-your-application/authentication/authorization',
            },
            {
              text: 'Session tracking',
              link: '/building-your-application/authentication/session-tracking',
            },
          ],
        },
        {
          text: '🧩 Integrations',
          id: '/building-your-application/integrations',
          items: [
            {
              text: 'Tauri',
              link: '/building-your-application/integrations/tauri',
            },
            {
              text: 'MDX',
              link: '/building-your-application/integrations/mdx',
            },
            {
              text: 'Tailwind CSS',
              link: '/building-your-application/integrations/tailwind-css',
            },
            {
              text: 'Panda CSS',
              link: '/building-your-application/integrations/panda-css',
            },
          ],
        },
        {
          text: '🔨 Building',
          id: '/building-your-application/building',
          link: '/building-your-application/building',
          items: [
            {
              text: 'Bun Server (default)',
              link: '/building-your-application/building/bun-server',
            },
            {
              text: 'Node.js Server',
              link: '/building-your-application/building/node-server',
            },
            {
              text: 'Deno Server',
              link: '/building-your-application/building/deno-server',
            },
            {
              text: 'Desktop app',
              link: '/building-your-application/building/desktop-app',
            },
            {
              text: 'Android app',
              link: '/building-your-application/building/android-app',
            },
            {
              text: 'iOS app',
              link: '/building-your-application/building/ios-app',
            },
            {
              text: 'Web Component Compiler',
              link: '/building-your-application/building/web-component-compiler',
            },
          ],
        },
        {
          text: '🚀 Deploying',
          id: '/building-your-application/deploying',
          link: '/building-your-application/deploying',
          items: [
            {
              text: 'Fly io',
              link: '/building-your-application/deploying/fly-io',
            },
            {
              text: 'AWS',
              link: '/building-your-application/deploying/aws',
            },
            {
              text: 'Render com',
              link: '/building-your-application/deploying/render-com',
            },
            {
              text: 'Vercel',
              link: '/building-your-application/deploying/vercel',
            },
            // {
            //   text: 'Netlify',
            //   link: '/building-your-application/deploying/netlify',
            // },
            // {
            //   text: 'Cloudflare',
            //   link: '/building-your-application/deploying/clourflare',
            // },
            {
              text: 'Writing a custom adapter',
              link: '/building-your-application/deploying/writing-a-custom-adapter',
            },
            {
              text: 'Docker',
              link: '/building-your-application/deploying/docker',
            },
          ],
        },
      ],
    },
    {
      text: '⚙️ API Reference',
      link: '/api-reference',
      id: '/api-reference',
      items: [
        {
          text: '🧩 Components',
          id: '/api-reference/components',
          items: [
            {
              text: 'Request context',
              link: '/api-reference/components/request-context',
            },
            {
              text: 'Web context',
              link: '/api-reference/components/web-context',
            },
            {
              text: 'Context provider',
              link: '/api-reference/components/context-provider',
            },
          ],
        },
        {
          id: '/api-reference/functions',
          text: '🗜️ Functions',
          items: [
            {
              text: 'createContext',
              link: '/api-reference/functions/createContext',
            },
            {
              text: 'createPortal',
              link: '/api-reference/functions/createPortal',
            },
            {
              text: 'dangerHTML',
              link: '/api-reference/functions/dangerHTML',
            },
            {
              text: 'navigate',
              link: '/api-reference/functions/navigate',
            },
            {
              text: 'notFound',
              link: '/api-reference/functions/notFound',
            },
            {
              text: 'throwable',
              link: '/api-reference/functions/throwable',
            },
          ],
        },
        {
          id: '/api-reference/extended-props',
          text: '📚 Extended HTML Attributes',
          items: [
            {
              text: 'debounceEvent',
              link: '/api-reference/extended-props/debounceEvent',
            },
            {
              link: '/api-reference/extended-props/indicateEvent',
              text: 'indicateEvent',
            },
            {
              link: '/api-reference/extended-props/key',
              text: 'key',
            },
            {
              link: '/api-reference/extended-props/ref',
              text: 'ref',
            },
            {
              link: '/api-reference/extended-props/skipSSR',
              text: 'skipSSR',
            },
            {
              link: '/api-reference/extended-props/renderOn',
              text: 'renderOn',
            },
            {
              link: '/api-reference/extended-props/renderMode',
              text: 'renderMode',
            },
          ],
        },
        {
          id: '/api-reference/server-apis',
          text: '🌐 Server APIs',
          items: [
            {
              text: 'rerenderInAction',
              link: '/api-reference/server-apis/rerenderInAction',
            },
            {
              text: 'renderToReadableStream',
              link: '/api-reference/server-apis/renderToReadableStream',
            },
            {
              text: 'renderToString',
              link: '/api-reference/server-apis/renderToString',
            },
            {
              text: 'getServeOptions',
              link: '/api-reference/server-apis/getServeOptions',
            },
            {
              text: 'fileSystemRouter',
              link: '/api-reference/server-apis/fileSystemRouter',
            },
            {
              text: 'Initiator',
              link: '/api-reference/server-apis/Initiator',
            },
            {
              text: 'serve',
              link: '/api-reference/server-apis/serve',
            },
            {
              text: 'encrypt',
              link: '/api-reference/server-apis/encrypt',
            },
            {
              text: 'decrypt',
              link: '/api-reference/server-apis/decrypt',
            },
            {
              text: 'SSRWebComponent',
              link: '/api-reference/server-apis/SSRWebComponent',
            },
            {
              text: 'getServer',
              link: '/api-reference/server-apis/getServer',
            },
            {
              text: 'Node.js APIs',
              items: [
                {
                  text: 'serve',
                  link: '/api-reference/server-apis/node/serve',
                },
                {
                  text: 'handler',
                  link: '/api-reference/server-apis/node/handler',
                },
              ],
            },
            {
              text: 'Deno APIs',
              items: [
                {
                  text: 'serve',
                  link: '/api-reference/server-apis/deno/serve',
                },
                {
                  text: 'handler',
                  link: '/api-reference/server-apis/deno/handler',
                },
              ],
            },
          ],
        },
        {
          id: '/api-reference/compiler-apis',
          text: '🛠️ Compiler APIs',
          items: [
            {
              text: 'compileWC',
              link: '/api-reference/compiler-apis/compileWC',
            },
          ],
        },
        {
          id: '/api-reference/brisa-cli',
          text: '🎮 Brisa CLI',
          link: '/api-reference/brisa-cli',
          items: [
            {
              text: 'brisa dev',
              link: '/api-reference/brisa-cli/brisa-dev',
            },
            {
              text: 'brisa build',
              link: '/api-reference/brisa-cli/brisa-build',
            },
            {
              text: 'brisa start',
              link: '/api-reference/brisa-cli/brisa-start',
            },
            {
              text: 'brisa add',
              link: '/api-reference/brisa-cli/brisa-add',
            },
          ],
        },
      ],
    },
  ],
} satisfies Config;
