import path from "node:path";
import getRootDir from "../get-root-dir";
import isImportableFileInDir from "../is-importable-file-in-dir";

const projectDir = getRootDir();
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const srcDir = path.join(projectDir, "src");
const existCustomLayoutAtTheBeginning = await isImportableFileInDir(
  "layout",
  srcDir,
);

export default async function LoadLayout({
  children,
}: {
  children: JSX.Element;
}) {
  const checkCustomLayout = IS_PRODUCTION
    ? existCustomLayoutAtTheBeginning
    : await isImportableFileInDir("layout", srcDir);

  if (!checkCustomLayout) {
    return (
      <html>
        <head>
          <title>Bunrise</title>
        </head>
        <body>{children}</body>
      </html>
    );
  }

  const CustomLayout = await import(path.join(srcDir, "layout"));
  return <CustomLayout.default>{children}</CustomLayout.default>;
}
