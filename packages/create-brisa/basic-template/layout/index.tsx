import Nav from '@/components/navigation';
import Footer from '@/components/footer';

export default function Layout({ children }: { children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ad1457" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/style.css" />
        <link rel="stylesheet" href="/nav.css" />
        <link rel="stylesheet" href="/footer.css" />
        <link rel="manifest" href="/manifest.json" />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header>
          <Nav />
        </header>
        <main>{children}</main>
      </body>
      <Footer />
    </html>
  );
}
