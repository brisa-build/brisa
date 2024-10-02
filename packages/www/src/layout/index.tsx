import Nav from '@/components/navigation';
import Footer from '@/components/footer';
import { dangerHTML, type RequestContext } from 'brisa';

import '@/styles/style.css';
import '@/styles/nav.css';
import '@/styles/content.css';
import '@/styles/footer.css';

const meta = {
  title: 'Brisa - The Web Platform Framework',
  description:
    'Brisa is a web platform framework that provides a refreshing development experience.',
  keywords:
    'web, framework, brisa, web platform, web development, static site generator, signals, jsx, typescript, server side rendering, ssr, web components',
  url: 'https://brisa.build/',
};

const ldjson = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Brisa',
  url: 'https://brisa.build/',
  logo: 'https://brisa.build/brisa.svg',
};

const speculationrules = {
  prerender: [
    {
      where: {
        href_matches: '/*',
      },
      eagerness: 'moderate',
    },
  ],
};

export default function Layout(
  { children }: { children: JSX.Element },
  { route }: RequestContext,
) {
  if (route.pathname === '/playground/preview') {
    return <PreviewLayout>{children}</PreviewLayout>;
  }

  const image = '/' + Bun.hash(route.pathname) + '.svg';

  return (
    <html lang="en">
      <head>
        <title id="title">{meta.title}</title>
        <link rel="icon" href="/brisa.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ccfbf1" />
        <meta id="meta:title" name="title" content={meta.title} />
        <meta
          id="meta:description"
          name="description"
          content={meta.description}
        />
        <meta id="keywords" name="keywords" content={meta.keywords} />
        <meta name="author" content="Brisa Team" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={meta.url} />
        <meta id="og:title" property="og:title" content={meta.title} />
        <meta
          id="og:description"
          property="og:description"
          content={meta.description}
        />
        <meta id="og:image" property="og:image" content={image} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={meta.url} />
        <meta
          id="twitter:title"
          property="twitter:title"
          content={meta.title}
        />
        <meta
          id="twitter:description"
          property="twitter:description"
          content={meta.description}
        />
        <meta id="twitter:image" property="twitter:image" content={image} />
        <meta name="robots" content="index, follow" />
        <script type="speculationrules">
          {dangerHTML(JSON.stringify(speculationrules))}
        </script>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-V43VPV66EX"
        ></script>
        <script>
          {dangerHTML(`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-V43VPV66EX');
          `)}
        </script>
        <script type="application/ld+json">
          {dangerHTML(JSON.stringify(ldjson))}
        </script>
      </head>
      <body>
        <script>
          {dangerHTML(`${initTheme.toString()};${initTheme.name}();`)}
        </script>
        <header>
          <Nav />
        </header>
        {children}
        {route.pathname !== '/playground' && <Footer />}
      </body>
    </html>
  );
}

function PreviewLayout({ children }: { children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <script type="importmap">
          {dangerHTML(`
           {
            "imports": {
              "brisa/client": "https://unpkg.com/brisa@latest/client-simplified/index.js"
            }
          }
        `)}
        </script>
      </head>
      <body style={{ backgroundColor: 'white' }}>{children}</body>
    </html>
  );
}

function initTheme() {
  if (document.body.classList.length) return;

  const theme = localStorage.getItem('theme');

  if (theme) {
    document.body.classList.add(theme);
    return;
  }

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark');
  }
}
