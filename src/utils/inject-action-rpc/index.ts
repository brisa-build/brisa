import path from "node:path";
import constants from "@/constants";

// Should be used via macro
export async function injectActionRPCCode() {
  return await buildRPC("rpc.ts");
}

// Should be used via macro
export async function injectActionRPCLazyCode() {
  return await buildRPC("resolve-rpc.ts");
}

async function buildRPC(file: string) {
  const { success, logs, outputs } = await Bun.build({
    entrypoints: [path.join(import.meta.dir, file)],
    target: "browser",
    minify: true,
    define: {
      __RPC_LAZY_FILE__: `'/_brisa/pages/_rpc-lazy-${constants.VERSION_HASH}.js'`,
    },
  });

  if (!success) console.error(logs);

  const code = (await outputs?.[0]?.text?.()) ?? "";

  return `(()=>{${code}})()`;
}
