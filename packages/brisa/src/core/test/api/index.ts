import { getServeOptions } from "@/cli/serve/serve-options";
import renderToString from "@/utils/render-to-string";

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
