import path from "node:path";
import getRootDir from "../get-root-dir";
import isImportableFileInDir from "../is-importable-file-in-dir";

const projectDir = getRootDir();
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const srcDir = path.join(projectDir, "src");
const doesCustomLayoutExist = await isImportableFileInDir("layout", srcDir);

export default async function LoadLayout({
  children,
}: {
  children: JSX.Element;
}) {
  const displayCustomLayout = IS_PRODUCTION
    ? doesCustomLayoutExist
    : await isImportableFileInDir("layout", srcDir);

  if (!displayCustomLayout) {
    return (
      <html>
        <head>
          <title>Bunrise</title>
        </head>
        <body>{children}</body>
      </html>
    );
  }

  const layoutModule = await import(path.join(srcDir, "layout"));
  const CustomLayout = layoutModule.default;

  return <CustomLayout>{children}</CustomLayout>;
}
