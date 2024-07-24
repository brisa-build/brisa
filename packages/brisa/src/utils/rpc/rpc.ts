import { registerActions } from '@/utils/rpc/register-actions';
import { stringifyAndCleanEvent } from '@/utils/rpc/serialize-and-clean-event';

const INDICATOR = 'indicator';
const BRISA_REQUEST_CLASS = 'brisa-request';
const $document = document;
const $window = window;
const method = 'POST';
const $Promise = Promise;
let controller = new AbortController();
let isReady = 0;

const bodyWithStore = (args?: unknown[], isFormData?: boolean) => {
  // @ts-ignore
  const xs = $window._s ? [..._s.Map] : $window._S ?? [];

  if (isFormData) {
    const form = new FormData(
      (args![0] as SubmitEvent).target as HTMLFormElement,
    );
    form.append('x-s', stringifyAndCleanEvent(xs));
    return form;
  }

  return stringifyAndCleanEvent({ 'x-s': xs, args });
};

function loadRPCResolver() {
  return $window._rpc
    ? $Promise.resolve()
    : new $Promise((res) => {
      const scriptElement = $document.createElement('script');
      const basePath = getAttribute($document.head, 'basepath') ?? '';
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
  dataSet: DOMStringMap,
  ...args: unknown[]
) {
  const errorIndicator = 'e' + indicator;
  const elementsWithIndicator = [];
  const store = $window._s;
  const promise = loadRPCResolver();

  // Add the "brisa-request" class to all indicators
  if (indicator) {
    for (const el of querySelectorAll(`[${INDICATOR}]`)) {
      if (getAttribute(el, INDICATOR)?.includes(indicator)) {
        el.classList.add(BRISA_REQUEST_CLASS);
        elementsWithIndicator.push(el);
        store?.set(indicator, true);
      }
    }
  }

  try {
    const res = await fetch(location.toString(), {
      method,
      signal: getAbortSignal(),
      headers: {
        'x-action': actionId,
        'x-actions': dataSet.actions ?? '',
      },
      body: bodyWithStore(args, isFormData),
    });

    if (!res.ok) {
      store?.set(errorIndicator, await res.text());
    }

    await promise;

    // Although !res.ok, we still want to resolve the server action to update signals,
    // like the error signal to display the error message in dev mode.
    await $window._rpc(res, dataSet, args);
    registerActions(rpc);
  } catch (e: any) {
    store?.set(errorIndicator, e.message);
  } finally {
    // Remove the "brisa-request" after resolve the server action
    for (const el of elementsWithIndicator) {
      el.classList.remove(BRISA_REQUEST_CLASS);
    }
    store?.set(indicator, false);
  }
}

function spaNavigation(event: any) {
  const renderMode =
    $window._xm ?? getAttribute(getActiveElement(), 'rendermode');

  // Clean render mode from imperative navigate API
  $window._xm = null;

  if (
    renderMode !== 'native' &&
    !event.hashChange &&
    event.downloadRequest === null &&
    event.canIntercept &&
    event.navigationType !== "replace"
  ) {
    event.intercept({
      async handler() {
        // We do not validate res.ok because we also want to render 404 or 500 pages.
        const res = await fetch(event.destination.url, {
          method,
          signal: getAbortSignal(),
          body: bodyWithStore(),
        });
        await loadRPCResolver();
        await $window._rpc(res, null, renderMode);
        $window.scrollTo(0, 0);
        registerActions(rpc);
      },
    });
  }
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

if ('navigation' in $window) {
  $window.navigation.addEventListener('navigate', spaNavigation);
}

$document.addEventListener('DOMContentLoaded', () => {
  isReady = 1;
  registerActions(rpc);
});
