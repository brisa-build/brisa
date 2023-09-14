import type { Props, ComponentType, JSXNode } from "../../types";
import extendStreamController, {
  Controller,
} from "../../utils/extend-stream-controller";
import BunriseRequest from "../bunrise-request";
import { injectUnsuspenseScript } from "../inject-unsuspense-script" assert { type: "macro" };

const ALLOWED_PRIMARIES = new Set(["string", "number"]);
const unsuspenseScriptCode = await injectUnsuspenseScript();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export default function renderToReadableStream(
  element: JSX.Element,
  request: BunriseRequest,
) {
  return new ReadableStream({
    async start(controller) {
      const extendedController = extendStreamController(controller);

      await enqueueDuringRendering(element, request, extendedController).catch(
        (e) => controller.error(e),
      );

      await extendedController.waitSuspensedPromises();

      controller.close();

      if (!IS_PRODUCTION && !extendedController.hasHeadTag) {
        console.error(
          "You should have a <head> tag in your document. Please review your layout. You can experiment some issues with browser JavaScript code without it.",
        );
      }
    },
  });
}

async function enqueueDuringRendering(
  element: JSXNode | Promise<JSXNode>,
  request: BunriseRequest,
  controller: Controller,
  suspenseId?: number,
): Promise<void> {
  const result = await Promise.resolve().then(() => element);
  const elements = Array.isArray(result) ? result : [result];

  for (const elementContent of elements) {
    if (elementContent === false || elementContent == null) continue;
    if (ALLOWED_PRIMARIES.has(typeof elementContent)) {
      controller.enqueue(elementContent.toString(), suspenseId);
      continue;
    }

    const { type, props } = elementContent;

    if (isComponent(type)) {
      const componentContent = { component: type, props };
      const isSuspenseComponent = isComponent(type.suspense);

      if (isSuspenseComponent) {
        const id = controller.nextSuspenseIndex();

        controller.startTag(`<div id="S:${id}">`, suspenseId);

        await enqueueComponent(
          { component: type.suspense, props },
          request,
          controller,
          suspenseId,
        );

        controller.endTag(`</div>`, suspenseId);

        return controller.suspensePromise(
          enqueueComponent(componentContent, request, controller, id),
        );
      }

      return enqueueComponent(
        componentContent,
        request,
        controller,
        suspenseId,
      );
    }

    const attributes = renderAttributes(props);

    controller.startTag(`<${type}${attributes}>`, suspenseId);

    // Node Content
    await enqueueChildren(props.children, request, controller, suspenseId);

    if (type === "head") {
      // Inject unsuspense script in the end of head
      controller.enqueue(unsuspenseScriptCode, suspenseId);
      controller.hasHeadTag = true;
    }

    // Node tag end
    controller.endTag(`</${type}>`, suspenseId);
  }
}

async function enqueueComponent(
  { component, props }: { component: ComponentType; props: Props },
  request: BunriseRequest,
  controller: Controller,
  suspenseId?: number,
): Promise<void> {
  const componentValue = await getValueOfComponent(component, props, request);

  if (ALLOWED_PRIMARIES.has(typeof componentValue)) {
    return controller.enqueue(componentValue.toString(), suspenseId);
  }

  if (Array.isArray(componentValue)) {
    return enqueueChildren(componentValue, request, controller, suspenseId);
  }

  return enqueueDuringRendering(
    componentValue,
    request,
    controller,
    suspenseId,
  );
}

async function enqueueChildren(
  children: JSXNode,
  request: BunriseRequest,
  controller: Controller,
  suspenseId?: number,
): Promise<void> {
  if (Array.isArray(children)) {
    for (const child of children) {
      await enqueueDuringRendering(child, request, controller, suspenseId);
    }
    return;
  }

  if (typeof children === "object") {
    return enqueueDuringRendering(children, request, controller, suspenseId);
  }

  if (typeof children?.toString === "function") {
    return controller.enqueue(children.toString(), suspenseId);
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
