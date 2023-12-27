import fs from "node:fs";
import type { ComponentType, Props, RequestContext } from "../../types";
import extendStreamController, {
  Controller,
} from "../extend-stream-controller";
import generateHrefLang from "../generate-href-lang";
import renderAttributes from "../render-attributes";
import { contextProvider } from "../context-provider/server";

const CONTEXT_PROVIDER = "context-provider";
const ALLOWED_PRIMARIES = new Set(["string", "number"]);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export default function renderToReadableStream(
  element: JSX.Element,
  request: RequestContext,
  head?: ComponentType,
) {
  return new ReadableStream({
    async start(controller) {
      const extendedController = extendStreamController(controller, head);
      const abortPromise = new Promise((res) =>
        request.signal.addEventListener("abort", res),
      );

      const renderingPromise = enqueueDuringRendering(
        element,
        request,
        extendedController,
      )
        .then(() => extendedController.waitSuspensedPromises())
        .catch((e) => controller.error(e));

      await Promise.race([abortPromise, renderingPromise]);

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
  element: JSX.Element,
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
    const isServerProvider = type === CONTEXT_PROVIDER && props.serverOnly;
    const isTagToIgnore = type?.__isFragment || isServerProvider;

    // Cases that is rendered an object <div>{object}</div>
    if (!type && !props) {
      controller.enqueue(elementContent.toString(), suspenseId);
      continue;
    }

    if (type === "HTML") {
      controller.enqueue(props.html, suspenseId);
      continue;
    }

    if (isComponent(type) && !isTagToIgnore) {
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
    const isContextProvider = type === CONTEXT_PROVIDER;
    let ctx: ReturnType<typeof contextProvider> | undefined;

    // Register context provider
    if (isContextProvider) {
      ctx = contextProvider({
        context: props.context,
        value: props.value,
        store: request.store,
      });
    }

    // Node tag start
    controller.startTag(
      isTagToIgnore ? null : `<${type}${attributes}>`,
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
      controller.enqueue(generateHrefLang(request), suspenseId);
      controller.hasHeadTag = true;
      controller.insideHeadTag = false;
    }

    if (type === "body") {
      const clientFile = request.route?.filePath?.replace(
        "/pages",
        "/pages-client",
      );

      // Transfer store to client
      if ((request as any).webStore.size > 0) {
        controller.enqueue(
          `<script>window._S=${JSON.stringify([
            ...(request as any).webStore,
          ])}</script>`,
          suspenseId,
        );
      }

      // Client file
      if (fs.existsSync(clientFile!)) {
        controller.enqueue(
          `<script>${await Bun.file(clientFile!).text()}</script>`,
          suspenseId,
        );
      }
    }

    // Clean consumed context
    if (ctx) {
      ctx.clearProvider();
    }

    // Node tag end
    controller.endTag(isTagToIgnore ? null : `</${type}>`, suspenseId);
  }
}

async function enqueueComponent(
  { component, props }: { component: ComponentType; props: Props },
  request: RequestContext,
  controller: Controller,
  suspenseId?: number,
): Promise<void> {
  const componentValue = (await getValueOfComponent(
    component,
    props,
    request,
  )) as JSX.Element;

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
  children: JSX.Element[] | JSX.Element,
  request: RequestContext,
  controller: Controller,
  suspenseId?: number,
): Promise<void> {
  if (Array.isArray(children)) {
    await enqueueArrayChildren(children, request, controller, suspenseId);
  } else if (typeof children === "object") {
    await enqueueDuringRendering(children, request, controller, suspenseId);
  } else if (typeof children?.toString === "function") {
    await controller.enqueue(Bun.escapeHTML(children.toString()), suspenseId);
  }
}

async function enqueueArrayChildren(
  children: JSX.Element[],
  request: RequestContext,
  controller: Controller,
  suspenseId?: number,
): Promise<void> {
  for (const child of children) {
    if (Array.isArray(child)) {
      await enqueueArrayChildren(child, request, controller, suspenseId);
    } else {
      await enqueueDuringRendering(child, request, controller, suspenseId);
    }
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
