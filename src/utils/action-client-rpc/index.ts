/// <reference lib="dom.iterable" />

function rpc(actionId: string, ...args: unknown[]) {
  console.log("RPC", actionId, args);
  // TODO: Implement RPC bridge between client and server
}

function registerActionsFromElements(elements: NodeListOf<Element>) {
  for (let element of elements) {
    if (!element.hasAttribute("data-action")) continue;

    element.removeAttribute("data-action");

    const allActions = (element as HTMLElement).dataset ?? {};

    for (let action of Object.keys(allActions)) {
      const actionName = action.toLowerCase();
      const actionPrefix = "actionon";

      if (!actionName.startsWith(actionPrefix)) continue;

      element.addEventListener(
        actionName.replace(actionPrefix, ""),
        (...args: unknown[]) => rpc(allActions[action]!, ...args),
      );
    }
  }
}

let timeout: ReturnType<typeof setTimeout>;

function initActionRegister() {
  registerActionsFromElements(document.querySelectorAll("[data-action]"));
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(initActionRegister, 0);
}

initActionRegister();

document.addEventListener("DOMContentLoaded", () => {
  initActionRegister();
  clearTimeout(timeout);
});
