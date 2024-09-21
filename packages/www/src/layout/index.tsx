import Nav from '@/components/navigation';
import Footer from '@/components/footer';
import { dangerHTML } from 'brisa';

const meta = {
  title: 'Brisa - The Web Platform Framework',
  description:
    'Brisa is a web platform framework that provides a refreshing development experience.',
  keywords: 'web, framework, brisa, web platform, web development',
  image: 'https://brisa.build/brisa.svg',
  url: 'https://brisa.build/',
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

export default function Layout({ children }: { children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <title id="title">{meta.title}</title>
        <link rel="icon" href="/brisa.svg" />

        <link rel="preload" href="/styles/style.css" as="style" />
        <link rel="stylesheet" href="/styles/style.css" />

        <link rel="preload" href="/styles/nav.css" as="style" />
        <link rel="stylesheet" href="/styles/nav.css" />

        <link rel="preload" href="/styles/content.css" as="style" />
        <link rel="stylesheet" href="/styles/content.css" />

        <link rel="preload" href="/styles/footer.css" as="style" />
        <link rel="stylesheet" href="/styles/footer.css" />

        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ccfbf1" />
        <meta name="title" content={meta.title} />
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="author" content="Brisa Team" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={meta.url} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={meta.url} />
        <meta property="twitter:title" content={meta.title} />
        <meta property="twitter:description" content={meta.description} />
        <meta property="twitter:image" content={meta.image} />
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
      </head>
      <body>
        <script>
          {dangerHTML(`${initTheme.toString()};${initTheme.name}();`)}
        </script>
        <header>
          <Nav />
        </header>
        {children}
        <Footer />
      </body>
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
