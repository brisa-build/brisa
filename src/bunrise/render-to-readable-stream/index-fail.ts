import { JSXElement } from "bunrise/jsx-runtime";
import type { Props, JSXNode } from "../../types/index";
import BunriseRequest from "../bunrise-request";
import { expect } from "bun:test";

function renderAttributes(props: Props): string {
  let attributes = "";

  for (const prop in props) {
    if (prop !== "children") attributes += ` ${prop}="${props[prop]}"`;
  }

  return attributes;
}

async function* renderChildren(
  children: JSXNode | undefined,
  request: BunriseRequest,
): AsyncGenerator<string> {
  async function* renderChild(child: JSXNode | undefined) {
    if (typeof child === "string") yield child;
    if (typeof child === "object") {
      yield* renderToAsyncGenerator(child, request);
    }
    yield "";
  }

  if (Array.isArray(children)) {
    let childrenString = "";
    const generators = await Promise.all(children.map(renderChild));
    for await (const generator of generators) {
      for await (const child of generator) {
        childrenString += child;
      }
    }

    yield childrenString;
  }

  yield* renderChild(children);
}

export async function* renderToAsyncGenerator(
  element: JSX.Element,
  request: BunriseRequest,
): AsyncGenerator<string> {
  const { type, props } = await Promise.resolve().then(() => element);
  let childrenString = "";

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
      yield jsx.toString();

    yield* renderToAsyncGenerator(jsx as JSXElement, request);
  }

  const attributes = renderAttributes(props);
  const content = renderChildren(props.children, request);

  for await (const child of content) {
    childrenString += child;
  }

  yield `<${type}${attributes}>${childrenString}</${type}>`;
}

export default function renderToStream(
  element: JSX.Element,
  request: BunriseRequest,
) {
  const htmlInAsyncGenerator = renderToAsyncGenerator(element, request);

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of htmlInAsyncGenerator) {
        controller.enqueue(chunk);
      }

      controller.close();
    },
  });
}
