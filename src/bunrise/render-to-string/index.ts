import type { Props, JSXNode } from "../../types/index";
import BunriseRequest from "../bunrise-request";

function renderAttributes(props: Props): string {
  let attributes = "";

  for (const prop in props) {
    if (prop !== "children") attributes += ` ${prop}="${props[prop]}"`;
  }

  return attributes;
}

async function renderChildren(
  children: JSXNode | undefined,
  request: BunriseRequest,
): Promise<string> {
  const renderChild = (child: JSXNode | undefined) => {
    if (typeof child === "string") return child;
    if (typeof child === "object") return renderToString(child, request);
    return "";
  };

  if (Array.isArray(children))
    return (await Promise.all(children.map(renderChild))).join("");

  return renderChild(children);
}

export default async function renderToString(
  element: JSX.Element,
  request: BunriseRequest,
): Promise<string> {
  const { type, props } = await Promise.resolve().then(() => element);

  if (typeof type === "function") {
    const handleError = (error: Error) => {
      if (typeof type.error === "function")
        return type.error({ error, ...props }, request);
      throw error;
    };

    const jsx = await Promise.resolve()
      .then(() => type(props, request))
      .catch(handleError);

    if (typeof jsx === "string" || typeof jsx === "number")
      return jsx.toString();

    return renderToString(jsx, request);
  }

  const attributes = renderAttributes(props);
  const content = await renderChildren(props.children, request);

  return `<${type}${attributes}>${content}</${type}>`;
}
