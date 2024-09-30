import './layout.css';

export default function Layout({ children }: { children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="viewport" content="width=device-width" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>Brisa - Tailwind CSS</title>
      </head>
      <body class="bg-gradient-to-tl via-transparent from-gray-500/5">
        <main class="relative max-w-6xl min-h-screen mx-auto py-6 lg:pt-10 px-4 pb-20">
          {children}
        </main>
      </body>
    </html>
  );
}
