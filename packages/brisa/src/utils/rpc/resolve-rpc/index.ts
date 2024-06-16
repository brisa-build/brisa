import { loadScripts, registerCurrentScripts } from "@/utils/rpc/load-scripts";
import diff from "diff-dom-streaming";

type RenderMode = "native" | "transition" | "reactivity";

const TRANSITION_MODE = "transition";
const $window = window as any;

// TODO: Implement render of component
async function resolveRPC(
  res: Response,
  dataSet: DOMStringMap,
  args: unknown[] | RenderMode = [],
) {
  const store = $window._s;
  const mode = res.headers.get("X-Mode");
  const urlToNavigate = res.headers.get("X-Navigate");
  const resetForm = res.headers.has("X-Reset");
  const transition = args === TRANSITION_MODE || mode === TRANSITION_MODE;

  // Reset form from the server action
  if (resetForm) {
    (args[0] as any).target.reset();
  }

  if (verifyBodyContentTypeOfResponse(res, "json")) {
    const entries = await res.json();

    // Store WITHOUT web components signals
    if (!store) $window._S = entries;
    // Store WITH web components signals
    else {
      for (const [key, value] of entries) {
        store.set(key, value);
      }
    }
  }

  // Navigate to a different page
  if (urlToNavigate) {
    $window._xm = mode;
    location.assign(urlToNavigate);
  }

  // Diff HTML Stream
  else if (verifyBodyContentTypeOfResponse(res, "html")) {
    registerCurrentScripts();

    await diff(document, res.body!.getReader(), {
      onNextNode: loadScripts,
      transition,
    });

    await $window.lastDiffTransition?.finished;
  }
}

$window._rpc = resolveRPC;

function verifyBodyContentTypeOfResponse(res: Response, contentType: string) {
  return res.body && res.headers.get("content-type")?.includes(contentType);
}
