import type { Props, ComponentType, JSXNode } from "../../types";
import extendStreamController, {
  Controller,
} from "../../utils/extend-stream-controller";
import RequestContext from "../request-context";
import { injectUnsuspenseScript } from "../inject-unsuspense-script" assert { type: "macro" };
import renderAttributes from "../../utils/render-attributes";
import generateHrefLang from "../../utils/generate-href-lang";

const ALLOWED_PRIMARIES = new Set(["string", "number"]);
const unsuspenseScriptCode = await injectUnsuspenseScript();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export default function renderToReadableStream(
  element: JSX.Element,
  request: RequestContext,
  head?: ComponentType,
) {
  return new ReadableStream({
    async start(controller) {
      const extendedController = extendStreamController(controller, head);

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
  request: RequestContext,
  controller: Controller,
  suspenseId?: number,
): Promise<void> {
  const result = await Promise.resolve().then(() => element);
  const elements = Array.isArray(result) ? result : [result];

  for (const elementContent of elements) {
    if (elementContent === false || elementContent == null) continue;
    if (ALLOWED_PRIMARIES.has(typeof elementContent)) {
      controller.enqueue(Bun.escapeHTML(elementContent.toString()), suspenseId);
      continue;
    }

    const { type, props } = elementContent;
    const isFragment = type?.__isFragment;

    if (type === "danger-html") {
      controller.enqueue(props.html, suspenseId);
      continue;
    }

    if (isComponent(type) && !isFragment) {
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

    if (controller.insideHeadTag && controller.hasId(props.id)) return;
    if (controller.insideHeadTag && props.id) controller.addId(props.id);

    const attributes = renderAttributes({ props, request, type });

    controller.startTag(
      isFragment ? null : `<${type}${attributes}>`,
      suspenseId,
    );

    if (type === "head" && controller.head) {
      controller.insideHeadTag = true;
      await enqueueComponent(
        { component: controller.head, props: {} },
        request,
        controller,
        suspenseId,
      );
    }

    // Node Content
    await enqueueChildren(props.children, request, controller, suspenseId);

    if (type === "head") {
      const optionalHrefLang = generateHrefLang(request);
      const codeToInject = `${optionalHrefLang}${unsuspenseScriptCode}`;

      controller.enqueue(codeToInject, suspenseId);
      controller.hasHeadTag = true;
      controller.insideHeadTag = false;
    }

    // Node tag end
    controller.endTag(isFragment ? null : `</${type}>`, suspenseId);
  }
}

async function enqueueComponent(
  { component, props }: { component: ComponentType; props: Props },
  request: RequestContext,
  controller: Controller,
  suspenseId?: number,
): Promise<void> {
  const componentValue = await getValueOfComponent(component, props, request);

  if (ALLOWED_PRIMARIES.has(typeof componentValue)) {
    return controller.enqueue(
      Bun.escapeHTML(componentValue.toString()),
      suspenseId,
    );
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
  request: RequestContext,
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
    return controller.enqueue(Bun.escapeHTML(children.toString()), suspenseId);
  }
}

function isComponent(type: unknown): boolean {
  return typeof type === "function";
}

async function getValueOfComponent(
  componentFn: ComponentType,
  props: Props,
  request: RequestContext,
) {
  return Promise.resolve()
    .then(() => componentFn(props, request) ?? "")
    .catch((error: Error) => {
      if (!isComponent(componentFn.error)) throw error;
      return componentFn.error({ error, ...props }, request);
    });
}
