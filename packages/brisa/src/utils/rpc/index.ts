import path from "node:path";
import constants from "@/constants";
import { logBuildError } from "@/utils/log/log-build";

// Should be used via macro
export async function injectRPCCode() {
  return await buildRPC("rpc.ts");
}

// Should be used via macro
export async function injectRPCLazyCode() {
  return await buildRPC(path.join("resolve-rpc", "index.ts"));
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

  if (!success) {
    logBuildError("Failed to compile RPC code", logs);
  }

  const code = (await outputs?.[0]?.text?.()) ?? "";

  return `(()=>{${code}})()`;
}
