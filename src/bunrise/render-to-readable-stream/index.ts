import type { Props, ComponentType, JSXNode } from "../../types";
import extendStreamController, {
  Controller,
} from "../../utils/extend-stream-controller";
import BunriseRequest from "../bunrise-request";
import injectUnsuspenseScript from "../inject-unsuspense-script"; // with { type: "macro" }

const ALLOWED_PRIMARIES = new Set(["string", "number"]);
const unsuspenseScriptCode = injectUnsuspenseScript();

export default function renderToReadableStream(
  element: JSX.Element,
  request: BunriseRequest,
) {
  return new ReadableStream({
    start(controller) {
      enqueueDuringRendering(
        element,
        request,
        extendStreamController(controller),
      )
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
      controller.enqueue({ chunk: elementContent.toString() });
      continue;
    }

    const { type, props } = elementContent;

    if (isComponent(type)) {
      const componentValue = await getValueOfComponent(type, props, request);

      if (ALLOWED_PRIMARIES.has(typeof componentValue)) {
        return controller.enqueue({ chunk: componentValue.toString() });
      }

      if (Array.isArray(componentValue)) {
        return enqueueChildren(componentValue, request, controller);
      }

      return enqueueDuringRendering(componentValue, request, controller);
    }

    const attributes = renderAttributes(props);

    // Node tag start
    controller.enqueue({ chunk: `<${type}${attributes}>`, isOpenOfTag: true });

    // Node Content
    await enqueueChildren(props.children, request, controller);

    if (type === "head") {
      // Inject unsuspense script in the end of head
      controller.enqueue({ chunk: unsuspenseScriptCode });
    }

    // Node tag end
    controller.enqueue({ chunk: `</${type}>`, isEndOfTag: true });
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
    return controller.enqueue({ chunk: children.toString() });
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
