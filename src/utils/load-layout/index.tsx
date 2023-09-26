import getImportableFilepath from "../get-importable-filepath";
import getRootDir from "../get-root-dir";

const rootDir = getRootDir();

export default async function LoadLayout({
  children,
}: {
  children: JSX.Element;
}) {
  const layoutPath = getImportableFilepath("layout", rootDir);

  if (!layoutPath) {
    return (
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Brisa</title>
        </head>
        <body>{children}</body>
      </html>
    );
  }

  const layoutModule = await import(layoutPath);
  const CustomLayout = layoutModule.default;

  return <CustomLayout>{children}</CustomLayout>;
}
