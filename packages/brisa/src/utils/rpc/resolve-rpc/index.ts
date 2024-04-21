import { loadScripts, registerCurrentScripts } from "@/utils/rpc/load-scripts";
import diff from "diff-dom-streaming";

async function resolveRPC(res: Response, args: unknown[] = []) {
  const urlToNavigate = res.headers.get("X-Navigate");
  const storeRaw = res.headers.get("X-S");
  const resetForm = res.headers.has("X-Reset-Form");

  // Reset form from the server action
  if (resetForm) {
    (args[0] as any).target.reset();
  }

  if (storeRaw) {
    const entries = JSON.parse(decodeURIComponent(storeRaw));

    // Store WITHOUT web components signals
    if (!window._s) window._S = entries;
    // Store WITH web components signals
    else {
      for (const [key, value] of entries) {
        window._s.set(key, value);
      }
    }
  }

  if (urlToNavigate) {
    location.href = urlToNavigate;
    return;
  }

  if (!res.body || !res.headers.get("content-type")) return;

  registerCurrentScripts();

  await diff(document, res.body.getReader(), loadScripts);
}

window._rpc = resolveRPC;
