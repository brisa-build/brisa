import { getServeOptions } from "@/cli/serve/serve-options";
import renderToString from "@/utils/render-to-string";
import { blueLog, greenLog, cyanLog } from "@/utils/log/log-color";
import { registerActions } from "@/utils/rpc/register-actions";

/**
 * Render a JSX element, a string or a Response object into a container
 */
export async function render(
  element: JSX.Element | Response | string,
  baseElement: HTMLElement = document.documentElement,
) {
  let container = baseElement;
  let htmlString;

  if (typeof element === "string") {
    htmlString = element;
  } else if (element instanceof Response) {
    htmlString = await element.text();
  } else {
    container = baseElement.appendChild(document.createElement("div"));
    globalThis.REGISTERED_ACTIONS = [];
    globalThis.FORCE_SUSPENSE_DEFAULT = false;
    htmlString = await renderToString(element);
    globalThis.FORCE_SUSPENSE_DEFAULT = undefined;
  }

  container.innerHTML = htmlString;

  const unmount = () => {
    container.innerHTML = "";
  };

  // Register Server Actions
  if (globalThis.REGISTERED_ACTIONS?.length) {
    registerActions(
      (
        actionId: string,
        isFormData: boolean,
        indicator: string | undefined,
        actionDeps: string | undefined,
        ...args: unknown[]
      ) => {
        globalThis.REGISTERED_ACTIONS[actionId](...args);
      },
    );
  }

  return { container, unmount };
}

/**
 * Serve a route and return the response
 */
export async function serveRoute(route: string) {
  const serveOptions = await getServeOptions();

  if (!serveOptions) {
    throw new Error(
      "Error: Unable to execute 'serveRoute'. Prior execution of 'brisa build' is required to utilize the 'serveRoute' method.",
    );
  }

  const url = new URL(route, "http://localhost:3000");
  const request = new Request(url);

  globalThis.FORCE_SUSPENSE_DEFAULT = false;
  const response = await (serveOptions as any).fetch(request, {
    requestIP: () => {},
    upgrade: () => false,
  });
  globalThis.FORCE_SUSPENSE_DEFAULT = undefined;

  return response;
}

export async function waitFor(fn: () => unknown) {
  try {
    fn();
  } catch (error) {
    await Bun.sleep(10);
    return waitFor(fn);
  }
}

/**
 * Debug the current DOM
 */
export function debug() {
  console.log(prettyDOM(document.documentElement));
}

function prettyDOM(element: HTMLElement, prefix: string = ""): any {
  const lines = [];
  const attrs = element.attributes;
  lines.push(prefix, blueLog("<" + element.localName));

  for (let i = 0; i < attrs.length; i += 1) {
    const attr = attrs[i];
    lines.push(
      "\n",
      prefix,
      "    ",
      cyanLog(attr.name),
      `=${greenLog('"' + attr.value + '"')}`,
    );
  }

  lines.push(blueLog(">"));
  let child = isTemplate(element)
    ? element.content.firstChild
    : element.firstChild;

  while (child) {
    if (isElement(child)) {
      lines.push("\n", prettyDOM(child, prefix + "  "));
    } else {
      lines.push("\n", prefix, child.textContent);
    }
    child = child.nextSibling;
  }

  lines.push("\n", prefix, blueLog(`</${element.localName}>`));
  return lines.join("");
}

function isElement(value: any): value is HTMLElement {
  return value && typeof value.nodeType === "number" && value.nodeType === 1;
}

function isTemplate(
  node: Node | null | undefined,
): node is HTMLTemplateElement {
  return (node as Element)?.tagName === "TEMPLATE";
}

/**
 * User events
 */
export const userEvent = {
  click: (element: Element) => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  },
  dblClick: (element: Element) => {
    element.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  },
  type: (element: HTMLInputElement, text: string) => {
    for (const char of text) {
      element.dispatchEvent(new KeyboardEvent("keydown", { key: char }));
      element.dispatchEvent(new KeyboardEvent("keypress", { key: char }));
      element.dispatchEvent(new KeyboardEvent("keyup", { key: char }));
      element.value += char;
      element.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
  },
  clear: (element: HTMLInputElement) => {
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "" }));
    element.dispatchEvent(new KeyboardEvent("keypress", { key: "" }));
    element.dispatchEvent(new KeyboardEvent("keyup", { key: "" }));
    element.value = "";
    element.dispatchEvent(new InputEvent("input", { bubbles: true }));
  },
  hover: (element: Element) => {
    element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  },
  unhover: (element: Element) => {
    element.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  },
  focus: (element: Element) => {
    element.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
  },
  blur: (element: Element) => {
    element.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
  },
  select: (element: HTMLSelectElement, value: string) => {
    element.value = value;
    dispatchEvent(new Event("change", { bubbles: true }));
  },
  deselect: (element: HTMLSelectElement, value: string) => {
    if (value === element.value) {
      element.value = "";
    }
    dispatchEvent(new Event("change", { bubbles: true }));
  },
  upload: (input: HTMLInputElement, file: File) => {
    // @ts-ignore
    input.files = [file];
    input.dispatchEvent(new Event("change", { bubbles: true }));
  },
  tab: () => {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
  },
  paste: (element: HTMLInputElement, text: string) => {
    element.value = text;
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        clipboardData: {
          getData: () => text,
        },
      } as any),
    );
  },
};
