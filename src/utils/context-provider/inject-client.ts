import path from "node:path";
import transformJSXToReactive from "@/utils/transform-jsx-to-reactive";

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
            contents: transformJSXToReactive(
              await Bun.file(path).text(),
              internalComponentId,
            ),
            loader,
          }));
        },
      },
    ],
  });

  if (!success) console.error(logs);

  return (await outputs?.[0]?.text?.()) ?? "";
}
