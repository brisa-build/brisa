import diff from "diff-dom-streaming";

const scripts = new Set();

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

  // Register all scripts from the current document
  for (let script of document.scripts) {
    if (script.hasAttribute("src")) scripts.add(script.getAttribute("src"));
  }

  await diff(document, res.body.getReader(), (node) => {
    if (node.nodeName === "SCRIPT") {
      // Load new scripts and manage "unsuspense" scripts
      const src = (node as HTMLScriptElement).getAttribute("src");
      if (!scripts.has(src)) {
        const script = document.createElement("script");
        if (src) script.src = src;
        script.innerHTML = (node as HTMLScriptElement).innerHTML;
        script.onload = script.onerror = () => script.remove();
        document.head.appendChild(script);
      }
    }
  });
}

window._rpc = resolveRPC;
