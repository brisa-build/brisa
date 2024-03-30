import htmlStreamWalker from "parse-html-stream/walker";
import diff from "../diff";

async function resolveRPC(res: Response) {
  const urlToNavigate = res.headers.get("X-Navigate");
  const storeRaw = res.headers.get("X-S");

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

  if (!res.body) return;

  const reader = res.body.getReader();
  const walker = await htmlStreamWalker(reader);
  const rootNode = walker.rootNode!;

  await diff(document, rootNode, walker);
}

window._rpc = resolveRPC;
