/// <reference lib="dom.iterable" />

const ACTION_ATTRIBUTE = "data-action";

/**
 * RPC (Remote Procedure Call)
 *
 * This function is used to call an action on the server.
 */
async function rpc(actionId: string, ...args: unknown[]) {
  const lang = document.documentElement.lang;
  const langPrefix = lang ? `/${lang}` : "";
  const res = await fetch(`${langPrefix}/_action/${actionId}`, {
    method: "POST",
    body: JSON.stringify(args),
  });
  const reader = res.body!.getReader();

  /**
   * The chunk is using Newline-delimited JSON (NDJSON) format.
   * This format is used to parse JSON objects from a stream.
   *
   * Content-Type: application/x-ndjson
   *
   * https://en.wikipedia.org/wiki/JSON_streaming#Newline-delimited_JSON
   *
   * Example:
   *
   * {"action": "foo"} \n {"action": "bar"} \n {"action": "baz"}
   *
   * The difference between this format and JSON is that this format
   * is not a valid JSON, but it is a valid JSON stream.
   *
   */
  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const text = new TextDecoder().decode(value);

    for (const json of text.split("\n")) {
      if (!json) continue;
      const { action, params, selector } = JSON.parse(json);

      // Redirect to a different page
      if (action === "navigate") {
        window.location.href = params[0];
      }
    }
  }
}

function registerActionsFromElements(elements: NodeListOf<Element>) {
  const actionPrefix = "actionon";

  for (let element of elements) {
    if (!element.hasAttribute(ACTION_ATTRIBUTE)) continue;

    element.removeAttribute(ACTION_ATTRIBUTE);

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
  registerActionsFromElements(
    document.querySelectorAll(`[${ACTION_ATTRIBUTE}]`),
  );
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(initActionRegister, 0);
}

initActionRegister();

document.addEventListener("DOMContentLoaded", () => {
  initActionRegister();
  clearTimeout(timeout);
});
