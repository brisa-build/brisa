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
      <body class="">
        <main class="">{children}</main>
      </body>
    </html>
  );
}
