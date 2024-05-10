import { getServeOptions } from "@/cli/serve/serve-options";
import renderToString from "@/utils/render-to-string";
import { blueLog, greenLog, cyanLog } from "@/utils/log/log-color";

export async function render(
  element: JSX.Element | Response | string,
  baseElement: HTMLElement = document.documentElement,
) {
  const container = baseElement.appendChild(document.createElement("div"));
  let htmlString;

  if (typeof element === "string") {
    htmlString = element;
  } else if (element instanceof Response) {
    htmlString = await element.text();
  } else {
    htmlString = await renderToString(element);
  }

  container.innerHTML = htmlString;

  const unmount = () => {
    container.innerHTML = "";
  };

  return { container, unmount };
}

export async function serveRoute(route: string) {
  const serveOptions = await getServeOptions();

  if (!serveOptions) {
    throw new Error(
      "Error: Unable to execute 'serveRoute'. Prior execution of 'brisa build' is required to utilize the 'serveRoute' method.",
    );
  }

  const url = new URL(route, "http://localhost:3000");
  const request = new Request(url);
  const response = await (serveOptions as any).fetch(request, {
    requestIP: () => {},
    upgrade: () => false,
  });

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
