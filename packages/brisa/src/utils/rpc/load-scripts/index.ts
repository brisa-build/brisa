const $window = window;
const $document = document;

export const scripts = new Set();

export function registerCurrentScripts() {
  for (let script of $document.scripts) {
    const hasValidID = script.id && !/R:\d+/.test(script.id);
    if (hasValidID || script.hasAttribute("src")) {
      scripts.add(script.id || script.getAttribute("src"));
    }
  }
}

// Load new scripts and manage "unsuspense" scripts
export async function loadScripts(node: Node) {
  if (node.nodeName !== "SCRIPT") return;

  const src = (node as HTMLScriptElement).getAttribute("src");

  if (scripts.has(src) || scripts.has((node as HTMLScriptElement).id)) {
    return;
  }

  if ($window.lastDiffTransition) await $window.lastDiffTransition.finished;

  const script = $document.createElement("script");

  if (src) script.src = src;

  script.innerHTML = (node as HTMLScriptElement).innerHTML;
  script.onload = script.onerror = () => script.remove();
  $document.head.appendChild(script);

  if (!src) script.remove();
}
