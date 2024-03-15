// import parseHTMLStream, { getNextNode } from "../parse-html-stream";
import diff from "../diff";

async function resolveRPC(res: Response) {
  const urlToNavigate = res.headers.get("X-Navigate");
  const storeRaw = res.headers.get("X-S");

  if (storeRaw) {
    const entries = JSON.parse(storeRaw);

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
    window.location.href = urlToNavigate;
    return;
  }

  // This is temporal meanwhile the diffing algorithm is not working with streaming
  const html = await res.text();

  if (!html) return;

  await diff(document, html);
}

window._rpc = resolveRPC;
