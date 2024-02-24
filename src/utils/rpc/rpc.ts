const ACTION = "action";
const ACTION_ATTRIBUTE = "data-" + ACTION;
const $document = document;
const stringify = JSON.stringify;
const $Promise = Promise;
let resolveRPC: ((res: Response) => Promise<void>) | undefined;
let isReady = false;

/**
 * RPC (Remote Procedure Call)
 *
 * This function is used to call an action on the server.
 */
async function rpc(actionId: string, isFormData = false, ...args: unknown[]) {
  let promise = resolveRPC
    ? $Promise.resolve()
    : new $Promise((res) => {
        let scriptElement = $document.createElement("script");
        scriptElement.type = "text/javascript";
        scriptElement.onload = res;
        scriptElement.onerror = res;
        // @ts-ignore
        scriptElement.fetchPriority = "high";
        scriptElement.src = __RPC_LAZY_FILE__;
        $document.head.appendChild(scriptElement);
      });

  const res = await fetch(location.toString(), {
    method: "POST",
    headers: {
      "x-action": actionId,
      // @ts-ignore
      "x-s": stringify(window._s ? [..._s.Map.entries()] : window._S),
    },
    body: isFormData
      ? new FormData((args[0] as SubmitEvent).target as HTMLFormElement)
      : stringify(args, serialize),
  });

  await promise;

  if (!resolveRPC) {
    resolveRPC = window._rpc;
    delete window._rpc;
  }

  resolveRPC!(res);
}

/**
 * Serialize function used to convert events to JSON.
 */
function serialize(k: string, v: unknown) {
  const isInstanceOf = (Instance: any) => v instanceof Instance;
  const isNode = isInstanceOf(Node);

  if (
    isInstanceOf(Event) ||
    (isNode && ["target", "currentTarget"].includes(k))
  ) {
    const ev: Record<string, any> = {};
    for (let field in v as any) ev[field] = (v as any)[field];
    if (isInstanceOf(CustomEvent)) ev._custom = true;
    return ev;
  }

  if (v == null || v === "" || isNode || isInstanceOf(Window)) return;
  return v;
}

function registerActions() {
  const elements = $document.querySelectorAll(`[${ACTION_ATTRIBUTE}]`);
  const onPrefix = "on";

  for (let element of elements) {
    if (!element.hasAttribute(ACTION_ATTRIBUTE)) continue;

    element.removeAttribute(ACTION_ATTRIBUTE);

    const dataSet = (element as HTMLElement).dataset;

    for (let [action, actionId] of Object.entries(dataSet)) {
      const actionName = action.toLowerCase();
      const eventAttrName = actionName.replace(ACTION, "");
      const eventName = eventAttrName.replace(onPrefix, "");
      const isFormData = element.nodeName === "FORM" && eventName === "submit";
      const debounceMs = +(
        element.getAttribute(eventAttrName + "-debounce") ?? 0
      );
      let timeout: ReturnType<typeof setTimeout>;

      if (actionName.startsWith(ACTION)) {
        element.addEventListener(eventName, (...args: unknown[]) => {
          if (args[0] instanceof Event) args[0].preventDefault();
          clearTimeout(timeout);
          timeout = setTimeout(
            () => rpc(actionId!, isFormData, ...args),
            debounceMs,
          );
        });
      }
    }
  }
}

function initActionRegister() {
  registerActions();
  if (!isReady) requestAnimationFrame(initActionRegister);
}

initActionRegister();

$document.addEventListener("DOMContentLoaded", () => {
  isReady = true;
  registerActions();
});
