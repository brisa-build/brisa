import { loadScripts, registerCurrentScripts } from "@/utils/rpc/load-scripts";
import diff from "diff-dom-streaming";

type RenderMode = "native" | "transition" | "reactivity";

const TRANSITION_MODE = "transition";
const $window = window as any;

async function resolveRPC(res: Response, args: unknown[] | RenderMode = []) {
  const urlToNavigate = res.headers.get("X-Navigate");
  const storeRaw = res.headers.get("X-S");
  const resetForm = res.headers.has("X-Reset");
  const transition =
    args === TRANSITION_MODE || res.headers.get("X-Mode") === TRANSITION_MODE;

  // Reset form from the server action
  if (resetForm) {
    (args[0] as any).target.reset();
  }

  if (storeRaw) {
    const entries = JSON.parse(decodeURIComponent(storeRaw));

    // Store WITHOUT web components signals
    if (!$window._s) $window._S = entries;
    // Store WITH web components signals
    else {
      for (const [key, value] of entries) {
        $window._s.set(key, value);
      }
    }
  }

  // Navigate to a different page
  if (urlToNavigate) {
    location.href = urlToNavigate;
  }

  // Diff HTML Stream
  else if (res.body && res.headers.get("content-type")) {
    registerCurrentScripts();

    await diff(document, res.body.getReader(), {
      onNextNode: loadScripts,
      transition,
    });

    await $window.lastDiffTransition?.finished;
  }
}

$window._rpc = resolveRPC;
