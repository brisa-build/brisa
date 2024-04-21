export const scripts = new Set();

export function registerCurrentScripts() {
  for (let script of document.scripts) {
    if (script.hasAttribute("src")) scripts.add(script.getAttribute("src"));
  }
}

// Load new scripts and manage "unsuspense" scripts
export function loadScripts(node: Node) {
  if (node.nodeName === "SCRIPT") {
    const src = (node as HTMLScriptElement).getAttribute("src");
    if (!scripts.has(src)) {
      const script = document.createElement("script");
      if (src) script.src = src;
      script.innerHTML = (node as HTMLScriptElement).innerHTML;
      script.onload = script.onerror = () => script.remove();
      document.head.appendChild(script);
    }
  }
}
