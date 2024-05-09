import renderToString from "@/utils/render-to-string";

export async function render(
  element: JSX.Element | Response,
  baseElement: HTMLElement = document.body,
) {
  const container = baseElement.appendChild(document.createElement("div"));
  const htmlString =
    element instanceof Response
      ? await element.text()
      : await renderToString(element);

  container.innerHTML = htmlString;

  const unmount = () => {
    container.innerHTML = "";
  };

  return { container, unmount };
}
