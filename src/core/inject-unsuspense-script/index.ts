import path from "node:path";

// Should be used via macro
export async function injectUnsuspenseScript() {
  const { success, logs, outputs } = await Bun.build({
    entrypoints: [path.join(import.meta.dir, "unsuspense.ts")],
    outdir: path.join(import.meta.dir, "out"),
    target: "browser",
    minify: true,
  });

  if (!success) console.error(logs);

  const code = (await outputs?.[0]?.text?.()) ?? "";

  return `<script>${code}</script>`;
}
