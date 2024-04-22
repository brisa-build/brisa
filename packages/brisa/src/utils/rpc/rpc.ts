const ACTION = "action";
const INDICATOR = "indicator";
const BRISA_REQUEST_CLASS = "brisa-request";
const ACTION_ATTRIBUTE = "data-" + ACTION;
const $document = document;
const $window = window;
const stringify = JSON.stringify;
const $Promise = Promise;
let controller = new AbortController();
let isReady = false;

function loadRPCResolver() {
  return $window._rpc
    ? $Promise.resolve()
    : new $Promise((res) => {
        let scriptElement = $document.createElement("script");
        const basePath = getAttribute($document.head, "basepath") ?? "";
        scriptElement.onload = scriptElement.onerror = res;
        scriptElement.src = basePath + __RPC_LAZY_FILE__;
        $document.head.appendChild(scriptElement);
      });
}

/**
 * RPC (Remote Procedure Call)
 *
 * This function is used to call an action on the server.
 */
async function rpc(
  actionId: string,
  isFormData = false,
  indicator: string | null,
  actionsDeps: string | undefined,
  ...args: unknown[]
) {
  const errorIndicator = "e" + indicator;
  const elementsWithIndicator = [];
  const store = $window._s;
  let promise = loadRPCResolver();

  // Add the "brisa-request" class to all indicators
  if (indicator) {
    for (let el of querySelectorAll(`[${INDICATOR}]`)) {
      if (getAttribute(el, INDICATOR)?.includes(indicator)) {
        el.classList.add(BRISA_REQUEST_CLASS);
        elementsWithIndicator.push(el);
        store?.set(indicator, true);
      }
    }
  }

  try {
    controller.abort();
    controller = new AbortController();
    const res = await fetch(location.toString(), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-action": actionId,
        "x-actions": actionsDeps ?? "",
        "x-s": encodeURIComponent(
          // @ts-ignore
          stringify(store ? [..._s.Map.entries()] : $window._S) ?? "",
        ),
      },
      body: isFormData
        ? new FormData((args[0] as SubmitEvent).target as HTMLFormElement)
        : stringify(args, serialize),
    });

    if (res.ok) {
      await promise;

      await $window._rpc(res, args);
    } else {
      store?.set(errorIndicator, await res.text());
    }
  } catch (e: any) {
    store?.set(errorIndicator, e.message);
  } finally {
    // Remove the "brisa-request" after resolve the server action
    for (let el of elementsWithIndicator) {
      el.classList.remove(BRISA_REQUEST_CLASS);
    }
    store?.set(indicator, false);
  }
}

/**
 * Serialize function used to convert events to JSON.
 */
function serialize(k: string, v: unknown) {
  const isInstanceOf = (Instance: any) => v instanceof Instance;
  const isNode = isInstanceOf(Node);

  if (isInstanceOf(Event) || (isNode && k.match(/target/i))) {
    const ev: Record<string, any> = {};
    for (let field in v as any) ev[field] = (v as any)[field];
    if (isInstanceOf(CustomEvent)) ev._wc = true;
    return ev;
  }

  if (v == null || v === "" || isNode || isInstanceOf(Window)) return;
  return v;
}

function registerActions() {
  const elements = querySelectorAll(`[${ACTION_ATTRIBUTE}]`);
  const onPrefix = "on";

  for (let element of elements) {
    if (!element.hasAttribute(ACTION_ATTRIBUTE)) continue;

    element.removeAttribute(ACTION_ATTRIBUTE);

    const dataSet = (element as HTMLElement).dataset;

    for (let [action, actionId] of Object.entries(dataSet)) {
      const actionName = action.toLowerCase();
      const eventName = actionName.replace(ACTION, "").replace(onPrefix, "");
      const isFormData = element.tagName === "FORM" && eventName === "submit";
      const debounceMs = +(getAttribute(element, "debounce" + eventName) ?? 0);
      let timeout: ReturnType<typeof setTimeout>;

      if (actionName.startsWith(ACTION)) {
        element.addEventListener(eventName, (...args: unknown[]) => {
          if (args[0] instanceof Event) args[0].preventDefault();
          clearTimeout(timeout);
          timeout = setTimeout(
            () =>
              rpc(
                actionId!,
                isFormData,
                getAttribute(element, "indicate" + eventName),
                dataSet.actions,
                ...args,
              ),
            debounceMs,
          );
        });
      }
    }
  }
}

function spaNavigation(event: any) {
  const url = new URL(event.destination.url);

  if (location.origin !== url.origin) return;

  event.intercept({
    async handler() {
      controller.abort();
      controller = new AbortController();
      const res = await fetch(url.pathname, { signal: controller.signal });

      if (res.ok) {
        await loadRPCResolver();
        document.documentElement.scrollTop = 0;
        await $window._rpc(res);
      }
    },
  });
}

function getAttribute(el: Element, attr: string) {
  return el.getAttribute(attr);
}

function querySelectorAll(query: string) {
  return $document.querySelectorAll(query);
}

function initActionRegister() {
  registerActions();
  if (!isReady) requestAnimationFrame(initActionRegister);
}

initActionRegister();

if ("navigation" in window) {
  window.navigation.addEventListener("navigate", spaNavigation);
}

$document.addEventListener("DOMContentLoaded", () => {
  isReady = true;
  registerActions();
});
