export function registerActions(rpc: Function) {
  const ACTION_ATTRIBUTE = "data-action";
  const $document = document;
  const elements = $document.querySelectorAll(`[${ACTION_ATTRIBUTE}]`);

  for (let element of elements) {
    // Remove the action attribute to avoid registering the same element twice
    element.removeAttribute(ACTION_ATTRIBUTE);

    const dataSet = (element as HTMLElement).dataset;

    for (let [action, actionId] of Object.entries(dataSet)) {
      const actionName = action.toLowerCase();
      const eventName = actionName.replace("action", "").replace("on", "");
      const isFormData = element.tagName === "FORM" && eventName === "submit";
      const debounceMs = +(element.getAttribute("debounce" + eventName) ?? 0);
      let timeout: ReturnType<typeof setTimeout>;

      if (actionName.startsWith("action")) {
        // It is registered once, when diffing the navigation, if the element
        // is the same, the action attribute (data-action) is not added and
        // therefore it is not added again, only the new elements that have
        // the data-action are registered.
        element.addEventListener(eventName, (...args: unknown[]) => {
          if (args[0] instanceof Event) args[0].preventDefault();
          clearTimeout(timeout);
          const callRPC = () =>
            rpc(
              actionId!,
              isFormData,
              element.getAttribute("indicate" + eventName)!,
              dataSet.actions,
              ...args,
            );
          if (debounceMs) timeout = setTimeout(callRPC, debounceMs);
          else callRPC();
        });
      }
    }
  }
}
