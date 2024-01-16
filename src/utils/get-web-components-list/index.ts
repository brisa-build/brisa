import fs from "node:fs";
import path from "node:path";
import { logError } from "@/utils/log/log-build";
import {
  ALTERNATIVE_PREFIX,
  NATIVE_FOLDER,
} from "@/utils/client-build-plugin/constants";

const CONTEXT_PROVIDER = "context-provider";

export default async function getWebComponentsList(
  dir: string,
): Promise<Record<string, string>> {
  const webDir = path.join(dir, "web-components");

  if (!fs.existsSync(webDir)) return {};

  const webRouter = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: webDir,
  });

  const existingSelectors = new Set<string>();

  const result = Object.fromEntries(
    Object.entries(webRouter.routes)
      .filter(
        ([key]) =>
          !key.includes(ALTERNATIVE_PREFIX) || key.includes(NATIVE_FOLDER),
      )
      .map(([key, path]) => {
        const selector = key.replace(/^\/(@-)?/g, "").replaceAll("/", "-");

        if (selector === CONTEXT_PROVIDER) {
          logError([
            `You can't use the reserved name "${CONTEXT_PROVIDER}"`,
            "Please, rename it to avoid conflicts.",
          ]);
        } else if (existingSelectors.has(selector)) {
          logError([
            `You have more than one web-component with the same name: "${selector}"`,
            "Please, rename one of them to avoid conflicts.",
          ]);
        } else {
          existingSelectors.add(selector);
        }

        return [selector, path];
      }),
  );

  return result;
}
