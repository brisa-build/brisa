import { registerActions } from "@/utils/rpc/register-actions";

const INDICATOR = "indicator";
const BRISA_REQUEST_CLASS = "brisa-request";
const $document = document;
const $window = window;
const stringify = JSON.stringify;
const $Promise = Promise;
let controller = new AbortController();
let isReady = 0;

const storeHeader = () => ({
  "x-s": encodeURIComponent(
    // @ts-ignore
    stringify($window._s ? [..._s.Map.entries()] : $window._S) ?? "",
  ),
});

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
    const res = await fetch(location.toString(), {
      method: "POST",
      signal: getAbortSignal(),
      headers: {
        "x-action": actionId,
        "x-actions": actionsDeps ?? "",
        ...storeHeader(),
      },
      body: isFormData
        ? new FormData((args[0] as SubmitEvent).target as HTMLFormElement)
        : stringify(args, serialize),
    });

    if (res.ok) {
      await promise;

      await $window._rpc(res, args);
      registerActions(rpc);
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

function spaNavigation(event: any) {
  const renderMode = getAttribute(getActiveElement(), "rendermode");

  if (
    renderMode === "native" ||
    event.hashChange ||
    event.downloadRequest !== null ||
    !event.canIntercept
  ) {
    return;
  }

  event.intercept({
    async handler() {
      // We do not validate res.ok because we also want to render 404 or 500 pages.
      const res = await fetch(event.destination.url, {
        signal: getAbortSignal(),
        headers: storeHeader(),
      });
      await loadRPCResolver();
      event.scroll();
      await $window._rpc(res, renderMode);
      registerActions(rpc);
    },
  });
}

function getActiveElement(element = $document.activeElement): Element | null {
  return element?.shadowRoot
    ? getActiveElement(element.shadowRoot.activeElement)
    : element;
}

function getAttribute(el: Element | null, attr: string) {
  return el?.getAttribute(attr);
}

function getAbortSignal() {
  controller.abort();
  controller = new AbortController();
  return controller.signal;
}

function querySelectorAll(query: string) {
  return $document.querySelectorAll(query);
}

function initActionRegister() {
  registerActions(rpc);
  if (!isReady) requestAnimationFrame(initActionRegister);
}

initActionRegister();

if ("navigation" in $window) {
  $window.navigation.addEventListener("navigate", spaNavigation);
}

$document.addEventListener("DOMContentLoaded", () => {
  isReady = 1;
  registerActions(rpc);
});
