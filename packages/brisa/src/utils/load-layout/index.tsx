export default async function LoadLayout({
  children,
  layoutModule,
}: {
  children: JSX.Element;
  layoutModule?: { default: (props: { children: JSX.Element }) => JSX.Element };
}) {
  if (!layoutModule) {
    return (
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta name="theme-color" content="#317EFB" />
          <title>Brisa</title>
        </head>
        <body>{children}</body>
      </html>
    );
  }

  const CustomLayout = layoutModule.default;

  return <CustomLayout>{children}</CustomLayout>;
}
