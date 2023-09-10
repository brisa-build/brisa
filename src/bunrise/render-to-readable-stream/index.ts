import type { Props, JSXNode } from "../../types/index";
import BunriseRequest from "../bunrise-request";

type Controller = {
  enqueue(chunk: string): void;
  close(): void;
};

function renderAttributes(props: Props): string {
  let attributes = "";

  for (const prop in props) {
    if (prop !== "children") attributes += ` ${prop}="${props[prop]}"`;
  }

  return attributes;
}

async function enqueueChildren(
  children: JSXNode | undefined,
  request: BunriseRequest,
  controller: Controller,
): Promise<void> {
  const enqueueChild = async (child: JSXNode | undefined) => {
    switch (typeof child) {
      case "string":
        return controller.enqueue(child);
      case "object":
        return enqueueDuringRendering(child, request, controller);
    }
  };

  if (Array.isArray(children)) {
    for (const child of children) await enqueueChild(child);
    return;
  }

  enqueueChild(children);
}

export async function enqueueDuringRendering(
  element: JSX.Element,
  request: BunriseRequest,
  controller: Controller,
): Promise<void> {
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

    if (typeof jsx === "string" || typeof jsx === "number") {
      return controller.enqueue(jsx.toString());
    }

    return enqueueDuringRendering(jsx, request, controller);
  }

  const attributes = renderAttributes(props);

  controller.enqueue(`<${type}${attributes}>`);
  await enqueueChildren(props.children, request, controller);
  controller.enqueue(`</${type}>`);
}

export default function renderToReadableStream(
  element: JSX.Element,
  request: BunriseRequest,
) {
  return new ReadableStream({
    async start(controller) {
      await enqueueDuringRendering(element, request, controller);
      controller.close();
    },
  });
}
