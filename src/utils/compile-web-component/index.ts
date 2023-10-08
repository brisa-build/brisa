import { readFile } from "node:fs/promises";
import { JavaScriptLoader } from "bun";

import getConstants from "../../constants";
import fromNative from "./from-native";

export default async function compileWebComponent(name: string) {
  const { SRC_DIR, CONFIG, WEB_COMPONENTS } = getConstants();
  const webEntrypoint = WEB_COMPONENTS[name];

  if (!webEntrypoint) return null;

  const { success, logs, outputs } = await Bun.build({
    entrypoints: [webEntrypoint],
    root: SRC_DIR,
    target: "browser",
    minify: true,
    // TODO: format: "iife" when Bun support it
    // https://bun.sh/docs/bundler#format
    plugins: [
      ...(CONFIG?.plugins ?? []),
      {
        name: "Define custom element",
        setup(build) {
          build.onLoad({ filter: /.*/ }, async ({ path, loader }) => {
            const jsLoader = loader as JavaScriptLoader;
            const code = await readFile(path, "utf8");
            return fromNative({ name, code, loader: jsLoader });
          });
        },
      },
    ],
  });

  if (!success) {
    logs.forEach((log) => console.error(log));
    return null;
  }

  return outputs[0].text();
}
