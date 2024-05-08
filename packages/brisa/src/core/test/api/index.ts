import renderToString from "@/utils/render-to-string";

export async function render(element: JSX.Element) {
  const htmlString = await renderToString(element);
  const container = document.createElement("div");

  container.innerHTML = htmlString;

  return { container };
}
