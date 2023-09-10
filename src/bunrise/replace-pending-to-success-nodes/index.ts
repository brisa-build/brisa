/// <reference lib="dom.iterable" />

/**
 * The pending and success nodes follow a hierarchical structure, where each node is identified
 * by a parent-child relationship. For example, a pending node with an ID of 1:1 represents the
 * parent, its child node would be 1:1.1, and any subsequent child nodes would be identified as
 * 1:1.1.1, 1:1.1.2, and so on.
 */
const sortByDepth = (a: Element, b: Element) =>
  b.id.split(".").length - a.id.split(".").length;

/**
 * Replace pending to success nodes. (Only executed in the browser)
 *
 * This is useful to display pending Components meanwhile is loading the rest
 * of the page via streaming. Until all the page is loaded, then replace the
 * pending Components to success Components.
 */
function replacePendingToSuccessNodes() {
  const pendings = Array.from(document.querySelectorAll("[id^=P\\:]")).sort(
    sortByDepth,
  );

  for (const pending of pendings) {
    const success = document.querySelector(`[id^=S\\:${pending.id.slice(2)}]`);
    if (!success) continue;
    pending.parentNode?.insertBefore(success.children[0], pending.nextSibling);
    success.remove();
    pending.remove();
  }

  // This removes the script that has this code after it has been executed.
  document.getElementById("R:0")?.remove();
}

replacePendingToSuccessNodes();
