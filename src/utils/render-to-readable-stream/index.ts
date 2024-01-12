import fs from "node:fs";

import type { ComponentType, Props, RequestContext } from "@/types";
import extendStreamController, {
  type Controller,
} from "@/utils/extend-stream-controller";
import generateHrefLang from "@/utils/generate-href-lang";
import renderAttributes from "@/utils/render-attributes";
import { isNotFoundError } from "@/utils/not-found";
import {
  clearProvidersByWCSymbol,
  contextProvider,
  registerSlotToActiveProviders,
  restoreSlotProviders,
} from "@/utils/context-provider/server";

type ProviderType = ReturnType<typeof contextProvider>;

type Options = {
  request: RequestContext;
  head?: ComponentType;
};

const CONTEXT_PROVIDER = "context-provider";
const ALLOWED_PRIMARIES = new Set(["string", "number"]);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const NO_INDEX = '<meta name="robots" content="noindex" />';
const SCRIPT_404 = `<script>(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.replace(u.toString())})()</script>`;

export default function renderToReadableStream(
  element: JSX.Element,
  { request, head }: Options,
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
        .catch(async (e) => {
          if (isNotFoundError(e)) {
            extendedController.enqueue(NO_INDEX);
            extendedController.enqueue(SCRIPT_404);
          } else {
            controller.error(e);
          }
        });

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
  isSlottedPosition = false,
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
    const isFragment = type?.__isFragment;
    const isTagToIgnore = isFragment || isServerProvider;
    const isWebComponent = type?.__isWebComponent || props?.__isWebComponent;
    const isElement = typeof type === "string";
    const isWebComponentSelector = isWebComponent && isElement;
    let slottedContentProviders: ProviderType[] | undefined;
    let isNextInSlottedPosition = isSlottedPosition;
    let webComponentSymbol: symbol | undefined;

    // In reality, only the Element have the slot attribute. Web-component is
    // an element, but during the renderToReadableStream it's executed as
    // server-component (function), and the fragment is used inside to wrap the
    // children with the slot="".
    //
    // Fragment component is not being exposed, it is only used internally.
    // To use it externally we use <></> to which you can't set properties like
    // slot.
    const isSlottedContent =
      typeof props?.slot === "string" &&
      isSlottedPosition &&
      (isElement || isWebComponent || isFragment);

    // Set that the next element is in slotted position and register the
    // web-component symbol. This is important to control the context provider
    // on the slotted content because these information will be necessary to
    // restore the provider in the slotted content, pause and clear it.
    if (isWebComponentSelector) {
      isNextInSlottedPosition = true;
      webComponentSymbol = Symbol("web-component");
      controller.setCurrentWebComponentSymbol(webComponentSymbol);
    } else if (isElement) {
      isNextInSlottedPosition = false;
    }

    // Cases that is rendered an object <div>{object}</div>
    if (!type && !props) {
      controller.enqueue(elementContent.toString(), suspenseId);
      continue;
    }

    // Danger HTML content using dangerHTML function
    if (type === "HTML") {
      controller.enqueue(props.html, suspenseId);
      continue;
    }

    // Register slot to active context providers
    if (type === "slot") {
      registerSlotToActiveProviders(props.name ?? "", request);
    }

    // Restore context providers paused to wait for slot content.
    // It's important to do it before execute the component, in this case
    // the web-component can use the context provider value
    if (isSlottedContent) {
      slottedContentProviders = restoreSlotProviders(props.slot, request);
    }

    // Manage context provider completion to wait for more slots (pause) or
    // clean the provider (clear) when the web-component that registered the
    // provider is completed.
    const manageContextProviderCompletion = () => {
      if (isWebComponentSelector && webComponentSymbol) {
        clearProvidersByWCSymbol(webComponentSymbol, request);
        return controller.setCurrentWebComponentSymbol();
      }
      if (!isSlottedContent || !slottedContentProviders?.length) return;
      for (const provider of slottedContentProviders) {
        provider.pauseProvider();
      }
    };

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
          isNextInSlottedPosition,
        );

        controller.endTag(`</div>`, suspenseId);

        return controller.suspensePromise(
          enqueueComponent(
            componentContent,
            request,
            controller,
            id,
            isNextInSlottedPosition,
          ),
        );
      }

      const res = await enqueueComponent(
        componentContent,
        request,
        controller,
        suspenseId,
        isNextInSlottedPosition,
      );

      manageContextProviderCompletion();

      return res;
    }

    if (controller.insideHeadTag && controller.hasId(props.id)) return;
    if (controller.insideHeadTag && props.id) controller.addId(props.id);

    const attributes = renderAttributes({ props, request, type });
    const isContextProvider = type === CONTEXT_PROVIDER;
    let ctx: ProviderType | undefined;

    // Register context provider
    if (isContextProvider) {
      ctx = contextProvider({
        context: props.context,
        value: props.value,
        store: request.store,
        webComponentSymbol: controller.getCurrentWebComponentSymbol(),
      });
    }

    // Node tag start
    controller.startTag(
      isTagToIgnore ? null : `<${type}${attributes}>`,
      suspenseId,
    );

    // Open head tag
    if (type === "head") {
      controller.insideHeadTag = true;
      if (controller.head) {
        await enqueueComponent(
          { component: controller.head, props: {} },
          request,
          controller,
          suspenseId,
          isNextInSlottedPosition,
        );
      }
    }

    // Node Content
    await enqueueChildren(
      props.children,
      request,
      controller,
      suspenseId,
      isNextInSlottedPosition,
    );

    // Close head tag
    if (type === "head") {
      controller.enqueue(generateHrefLang(request), suspenseId);
      controller.hasHeadTag = true;
      controller.insideHeadTag = false;
    }

    // Close body tag
    else if (type === "body") {
      const clientFile = request.route?.filePath
        ?.replace("/pages", "/pages-client")
        ?.replace(".js", ".txt");

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
        const hash = await Bun.file(clientFile).text();
        const filename = request.route.src.replace(".js", `-${hash}.js`);

        controller.enqueue(
          `<script async src="/_brisa/pages/${filename}"></script>`,
          suspenseId,
        );
      }
    }

    if (ctx) {
      // Pause context provider to wait for slots
      if (ctx.hasSomeSlot()) ctx.pauseProvider();
      // Clean consumed context
      else ctx.clearProvider();
    }

    manageContextProviderCompletion();

    // Node tag end
    controller.endTag(isTagToIgnore ? null : `</${type}>`, suspenseId);
  }
}

async function enqueueComponent(
  { component, props }: { component: ComponentType; props: Props },
  request: RequestContext,
  controller: Controller,
  suspenseId?: number,
  isSlottedPosition = false,
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
    return enqueueChildren(
      componentValue,
      request,
      controller,
      suspenseId,
      isSlottedPosition,
    );
  }

  return enqueueDuringRendering(
    componentValue,
    request,
    controller,
    suspenseId,
    isSlottedPosition,
  );
}

async function enqueueChildren(
  children: JSX.Element[] | JSX.Element,
  request: RequestContext,
  controller: Controller,
  suspenseId?: number,
  isSlottedPosition = false,
): Promise<void> {
  if (Array.isArray(children)) {
    await enqueueArrayChildren(
      children,
      request,
      controller,
      suspenseId,
      isSlottedPosition,
    );
  } else if (typeof children === "object") {
    await enqueueDuringRendering(
      children,
      request,
      controller,
      suspenseId,
      isSlottedPosition,
    );
  } else if (typeof children?.toString === "function") {
    await controller.enqueue(Bun.escapeHTML(children.toString()), suspenseId);
  }
}

async function enqueueArrayChildren(
  children: JSX.Element[],
  request: RequestContext,
  controller: Controller,
  suspenseId?: number,
  isSlottedPosition = false,
): Promise<void> {
  for (const child of children) {
    if (Array.isArray(child)) {
      await enqueueArrayChildren(
        child,
        request,
        controller,
        suspenseId,
        isSlottedPosition,
      );
    } else {
      await enqueueDuringRendering(
        child,
        request,
        controller,
        suspenseId,
        isSlottedPosition,
      );
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
