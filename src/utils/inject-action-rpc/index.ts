import path from "node:path";

// Should be used via macro
export async function injectActionRPCCode() {
  const { success, logs, outputs } = await Bun.build({
    entrypoints: [path.join(import.meta.dir, "rpc.ts")],
    target: "browser",
    minify: true,
  });

  if (!success) console.error(logs);

  const code = (await outputs?.[0]?.text?.()) ?? "";

  return `(()=>{${code}})()`;
}
