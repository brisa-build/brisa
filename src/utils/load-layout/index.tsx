import fs from "node:fs/promises";
import path from "node:path";
import getRootDir from "../get-root-dir";

const projectDir = getRootDir();
const srcDir = path.join(projectDir, "src");
const supportedFormats = ["tsx", "ts", "js"];
const supportedPaths = [
  path.join(srcDir, "layout", "index"),
  path.join(srcDir, "layout"),
];
const existCustomLayout = (
  await Promise.all(
    supportedPaths.flatMap((path) =>
      supportedFormats.map((format) => fs.exists(`${path}.${format}`)),
    ),
  )
).some((exist) => exist);

export default async function LoadLayout({
  children,
}: {
  children: JSX.Element;
}) {
  if (existCustomLayout) {
    const CustomLayout = await import(path.join(srcDir, "layout"));
    // TODO: analyze and alert about missing layout tags: html, head, body
    return <CustomLayout.default>{children}</CustomLayout.default>;
  }

  // Default layout
  return (
    <html>
      <head>
        <title>Bunrise</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
