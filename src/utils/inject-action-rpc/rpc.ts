/// <reference lib="dom.iterable" />

// RPC (Remote Procedure Call)
async function rpc(actionId: string, ...args: unknown[]) {
  // TODO: Implement RPC communication correctly, now is a POC (proof of concept)
  await fetch(`/_action/${actionId}`, {
    method: "POST",
    body: JSON.stringify(args),
  });
}

function registerActionsFromElements(elements: NodeListOf<Element>) {
  const actionPrefix = "actionon";

  for (let element of elements) {
    if (!element.hasAttribute("data-action")) continue;

    element.removeAttribute("data-action");

    const dataSet = (element as HTMLElement).dataset;

    for (let [action, actionId] of Object.entries(dataSet)) {
      const actionName = action.toLowerCase();

      if (actionName.startsWith(actionPrefix)) {
        element.addEventListener(
          actionName.replace(actionPrefix, ""),
          (...args: unknown[]) => rpc(actionId!, ...args),
        );
      }
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
