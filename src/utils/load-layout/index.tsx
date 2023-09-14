import fs from "node:fs/promises";
import path from "node:path";
import getRootDir from "../get-root-dir";

const projectDir = getRootDir();
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const srcDir = path.join(projectDir, "src");
const supportedFormats = ["tsx", "ts", "js"];
const supportedPaths = [
  path.join(srcDir, "layout", "index"),
  path.join(srcDir, "layout"),
];

async function isCustomLayout() {
  const promises = supportedPaths.flatMap((path) =>
    supportedFormats.map((format) => fs.exists(`${path}.${format}`)),
  );

  const results = await Promise.all(promises);

  return results.some((exist) => exist);
}

const existCustomLayoutAtTheBeginning = await isCustomLayout();

export default async function LoadLayout({
  children,
}: {
  children: JSX.Element;
}) {
  const checkCustomLayout = IS_PRODUCTION
    ? existCustomLayoutAtTheBeginning
    : await isCustomLayout();

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
