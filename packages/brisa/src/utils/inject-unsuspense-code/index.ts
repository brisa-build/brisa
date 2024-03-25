import path from "node:path";

// Should be used via macro
export async function injectUnsuspenseCode() {
  const { success, logs, outputs } = await Bun.build({
    entrypoints: [path.join(import.meta.dir, "unsuspense.ts")],
    target: "browser",
    minify: true,
  });

  if (!success) console.error(logs);

  return (await outputs?.[0]?.text?.()) ?? "";
}
