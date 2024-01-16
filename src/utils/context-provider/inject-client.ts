import path from "node:path";
import clientBuildPlugin from "@/utils/client-build-plugin";

// Should be used via macro
export async function injectClientContextProviderCode() {
  const pathname = path.join(import.meta.dir, "client.tsx");
  const internalComponentId = "__BRISA_CLIENT__contextProvider";

  const { success, logs, outputs } = await Bun.build({
    entrypoints: [pathname],
    target: "browser",
    external: ["brisa"],
    plugins: [
      {
        name: "context-provider-transformer",
        setup(build) {
          build.onLoad({ filter: /.*/ }, async ({ path, loader }) => ({
            contents: clientBuildPlugin(
              // TODO: use Bun.file(path).text() when Bun fix this issue:
              // https://github.com/oven-sh/bun/issues/7611
              await Bun.readableStreamToText(Bun.file(path).stream()),
              internalComponentId,
            ).code,
            loader,
          }));
        },
      },
    ],
  });

  if (!success) console.error(logs);

  return (await outputs?.[0]?.text?.()) ?? "";
}
