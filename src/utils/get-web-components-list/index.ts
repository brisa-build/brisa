import path from "node:path";
import fs from "node:fs";

export default function getWebComponentsList(
  dir: string,
): Record<string, string> {
  const webDir = path.join(dir, "web-components");

  if (!fs.existsSync(webDir)) return {};

  const webRouter = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: webDir,
  });

  return Object.fromEntries(
    Object.entries(webRouter.routes).map(([key, path]) => [
      key.replace(/^\/@?/g, "").replaceAll("/", "-"),
      path,
    ]),
  );
}
