import renderToString from "@/utils/render-to-string";

export async function render(
  element: JSX.Element | Response,
  baseElement: HTMLElement = document.body,
) {
  const container = document.createElement("div");
  const htmlString =
    element instanceof Response
      ? await element.text()
      : await renderToString(element);

  container.innerHTML = htmlString;

  const unmount = () => {
    container.innerHTML = "";
  };

  baseElement.appendChild(container);

  return { container, unmount };
}
