import { expect } from "bun:test";
import type { Props, ComponentType, JSXNode } from "../../types";
import BunriseRequest from "../bunrise-request";

const ALLOWED_PRIMARIES = new Set(["string", "number"]);

type Controller = {
  enqueue(chunk: string): void;
  close(): void;
};

export default function renderToReadableStream(
  element: JSX.Element,
  request: BunriseRequest,
) {
  return new ReadableStream({
    start(controller) {
      enqueueDuringRendering(element, request, controller)
        .then(() => controller.close())
        .catch((e) => controller.error(e));
    },
  });
}

async function enqueueDuringRendering(
  element: JSXNode | Promise<JSXNode>,
  request: BunriseRequest,
  controller: Controller,
): Promise<void> {
  const result = await Promise.resolve().then(() => element);
  const elements = Array.isArray(result) ? result : [result];

  for (const elementContent of elements) {
    if (elementContent === false || elementContent == null) continue;
    if (ALLOWED_PRIMARIES.has(typeof elementContent)) {
      controller.enqueue(elementContent.toString());
      continue;
    }

    const { type, props } = elementContent;

    if (isComponent(type)) {
      const jsx = await getValueOfComponent(type, props, request);
      if (ALLOWED_PRIMARIES.has(typeof jsx)) return controller.enqueue(jsx.toString());
      if (Array.isArray(jsx)) return enqueueChildren(jsx, request, controller);
      return enqueueDuringRendering(jsx, request, controller);
    }

    const attributes = renderAttributes(props);

    controller.enqueue(`<${type}${attributes}>`);
    await enqueueChildren(props.children, request, controller);
    controller.enqueue(`</${type}>`);
  }
}

async function enqueueChildren(
  children: JSXNode,
  request: BunriseRequest,
  controller: Controller,
): Promise<void> {
  if (Array.isArray(children)) {
    for (const child of children) {
      await enqueueDuringRendering(child, request, controller);
    }
    return;
  }

  if (typeof children === "object") {
    return enqueueDuringRendering(children, request, controller);
  }

  if (typeof children?.toString === "function") {
    return controller.enqueue(children.toString());
  }
}

function renderAttributes(props: Props): string {
  let attributes = "";

  for (const prop in props) {
    if (prop !== "children") attributes += ` ${prop}="${props[prop]}"`;
  }

  return attributes;
}

function isComponent(type: unknown): boolean {
  return typeof type === "function";
}

async function getValueOfComponent(
  componentFn: ComponentType,
  props: Props,
  request: BunriseRequest,
) {
  return Promise.resolve()
    .then(() => componentFn(props, request) ?? "")
    .catch((error: Error) => {
      if (!isComponent(componentFn.error)) throw error;
      return componentFn.error({ error, ...props }, request);
    });
}
