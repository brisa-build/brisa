export default function Layout({ children }: { children: JSX.Element }) {
  return (
    <html>
      <head>
        <title>CUSTOM LAYOUT</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
