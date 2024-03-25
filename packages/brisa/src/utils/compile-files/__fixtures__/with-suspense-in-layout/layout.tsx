export default function Layout({ children }: { children: JSX.Element }) {
  return (
    <html>
      <head>
        <title id="title">CUSTOM LAYOUT</title>
      </head>
      <body>
        <Foo />
        {children}
      </body>
    </html>
  );
}

async function Foo() {
  return <div>Foo</div>;
}

Foo.suspense = () => {
  return <div>Loading....</div>;
};
