import fs from "node:fs";
import path from "node:path";
import getConstants from "../../constants";

export default async function getWebComponentsList(
  dir: string
): Promise<Record<string, string>> {
  const { LOG_PREFIX } = getConstants();
  const webDir = path.join(dir, "web-components");

  if (!fs.existsSync(webDir)) return {};

  const webRouter = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: webDir,
  });

  const existingSelectors = new Set<string>();

  const result = Object.fromEntries(
    Object.entries(webRouter.routes).map(([key, path]) => {
      const selector = key.replace(/^\/@?/g, "").replaceAll("/", "-");

      if (existingSelectors.has(selector)) {
        console.log(LOG_PREFIX.ERROR, "Ops! Error:");
        console.log(LOG_PREFIX.ERROR, "--------------------------");
        console.log(
          LOG_PREFIX.ERROR,
          `You have more than one web-component with the same name: "${selector}"`
        );
        console.log(
          LOG_PREFIX.ERROR,
          "Please, rename one of them to avoid conflicts."
        );
        console.log(LOG_PREFIX.ERROR, "--------------------------");
      }

      existingSelectors.add(selector);

      return [selector, path];
    })
  );

  return result;
}
