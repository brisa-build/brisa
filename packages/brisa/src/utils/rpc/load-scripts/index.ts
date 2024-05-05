export const scripts = new Set();

let scriptLoaded: Promise<void>;

export function registerCurrentScripts() {
  for (let script of document.scripts) {
    const hasValidID = script.id && !/R:\d+/.test(script.id);
    if (hasValidID || script.hasAttribute("src")) {
      scripts.add(script.id || script.getAttribute("src"));
    }
  }
}

// Load new scripts and manage "unsuspense" scripts
export async function loadScripts(node: Node) {
  const $window = window;
  const $document = document;

  if (node.nodeName !== "SCRIPT") return;

  const src = (node as HTMLScriptElement).getAttribute("src");

  if (scripts.has(src) || scripts.has((node as HTMLScriptElement).id)) {
    return;
  }

  await $window.lastDiffTransition?.finished;

  const script = $document.createElement("script");

  if (src) script.src = src;

  script.innerHTML = (node as HTMLScriptElement).innerHTML;

  await scriptLoaded;

  if (src) {
    scriptLoaded = new Promise(
      (r) => (script.onload = script.onerror = () => r(script.remove())),
    );
  }

  $document.head.appendChild(script);

  if (!src) {
    script.remove();
  }
}
