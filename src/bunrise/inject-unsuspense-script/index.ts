import path from 'node:path';

const { success, logs, outputs } = await Bun.build({
  entrypoints: [path.join(import.meta.dir, "unsuspense.ts")],
  outdir: path.join(import.meta.dir, "out"),
  target: "browser",
  minify: true,
})

if (!success) console.error(logs);

const code = await outputs?.[0]?.text?.() ?? '';

// This should be imported using a macro
export default function injectUnsuspenseScript() {
  return `<script>${code}</script>`;
}
