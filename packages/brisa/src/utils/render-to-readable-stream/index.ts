import fs from 'node:fs';
import path from 'node:path';

import type { ComponentType, Props, RequestContext } from '@/types';
import extendStreamController, {
  type Controller,
} from '@/utils/extend-stream-controller';
import generateHrefLang from '@/utils/generate-href-lang';
import renderAttributes from '@/utils/render-attributes';
import { isNotFoundError } from '@/utils/not-found';
import {
  clearProvidersByWCSymbol,
  contextProvider,
  registerSlotToActiveProviders,
  restoreSlotProviders,
} from '@/utils/context-provider/server';
import { getConstants } from '@/constants';
import overrideClientTranslations from '@/utils/translate-core/override-client-translations';
import processServerComponentProps from '@/utils/process-server-component-props';
import extendRequestContext from '@/utils/extend-request-context';
import type { Options } from '@/types/server';
import { toInline } from '@/helpers';
import { logError } from '@/utils/log/log-build';
import { getNavigateMode, isNavigateThrowable } from '@/utils/navigate/utils';
import { RenderInitiator } from '@/public-constants';
import get404ClientScript from '@/utils/not-found/client-script';

type ProviderType = ReturnType<typeof contextProvider>;

const CONTEXT_PROVIDER = 'context-provider';
const ALLOWED_PRIMARIES = new Set(['string', 'number']);
const NO_INDEX = '<meta name="robots" content="noindex" />';

export default function renderToReadableStream(
  element: JSX.Element,
  {
    request,
    head,
    isPage = true,
    // Useful default to avoid suspense in tests, because tests not
    // use HTML streaming ("render" and "serveRoute" testing API)
    applySuspense = globalThis.FORCE_SUSPENSE_DEFAULT ?? true,
  }: Options,
) {
  const req = extendRequestContext({ originalRequest: request });
  const { IS_PRODUCTION, BUILD_DIR } = getConstants();
  const pagesClientPath = path.join(BUILD_DIR, 'pages-client');
  const unsuspenseListPath = path.join(pagesClientPath, '_unsuspense.txt');
  const actionRPCListPath = path.join(pagesClientPath, '_rpc.txt');
  let aborted = false;

  return new ReadableStream({
    async start(controller) {
      const extendedController = extendStreamController({
        controller,
        head,
        applySuspense,
        request: req,
      });
      const abortPromise = new Promise((res) =>
        req.signal.addEventListener('abort', () => {
          aborted = true;
          res(aborted);
        }),
      );

      extendedController.hasUnsuspense = await isInPathList(
        unsuspenseListPath,
        req,
      );

      // @deprecated
      // TODO: Remove the list generared + replace this to tack type.__isAction
      extendedController.hasActionRPC = await isInPathList(
        actionRPCListPath,
        req,
      );

      const renderingPromise = enqueueDuringRendering(
        element,
        req,
        extendedController,
      )
        .then(() => extendedController.waitSuspensedPromises())
        .then(() => extendedController.transferStoreToClient())
        .catch(async (e) => {
          if (isNotFoundError(e)) {
            extendedController.enqueue(NO_INDEX);
            extendedController.transferStoreToClient();
            extendedController.enqueue(get404ClientScript(req));
          } else if (isNavigateThrowable(e)) {
            const action =
              req.renderInitiator === RenderInitiator.SERVER_ACTION
                ? 'assign'
                : 'replace';

            extendedController.transferStoreToClient();
            extendedController.enqueue(
              `<script>window._xm="${getNavigateMode(e)}";location.${action}("${
                e.message
              }")</script>`,
            );
          } else {
            controller.error(e);
          }
        });

      await Promise.race([abortPromise, renderingPromise]);

      controller.close();

      if (
        isPage &&
        !IS_PRODUCTION &&
        !aborted &&
        !extendedController.hasHeadTag
      ) {
        logError({
          messages: [
            'No <head> tag',
            'You should have a <head> tag in your document. Please review your layout. You can experiment some issues with client JavaScript code without it.',
          ],
          docTitle: 'Documentation about layout',
          docLink:
            'https://brisa.build/building-your-application/routing/pages-and-layouts.html#layout',
        });
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
  componentProps?: Props,
): Promise<void> {
  const result = await Promise.resolve().then(() => element);
  const elements = Array.isArray(result) ? result : [result];
  const { BUILD_DIR, VERSION_HASH, CONFIG, IS_DEVELOPMENT, IS_SERVE_PROCESS } =
    getConstants();
  const basePath = CONFIG.basePath || '';
  const compiledPagesPath = basePath + '/_brisa/pages';

  for (const elementContent of elements) {
    if (elementContent === false || elementContent == null) continue;
    if (ALLOWED_PRIMARIES.has(typeof elementContent)) {
      controller.enqueue(Bun.escapeHTML(elementContent.toString()), suspenseId);
      continue;
    }

    const { type, props } = elementContent as any;
    const isServerProvider = type === CONTEXT_PROVIDER && props.serverOnly;
    const isFragment = type?.__isFragment;
    const isTagToIgnore = isFragment || isServerProvider;
    const isWebComponent = type?.__isWebComponent || props?.__isWebComponent;
    const isElement = typeof type === 'string';
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
      typeof props?.slot === 'string' &&
      isSlottedPosition &&
      (isElement || isWebComponent || isFragment);

    // Set that the next element is in slotted position and register the
    // web-component symbol. This is important to control the context provider
    // on the slotted content because these information will be necessary to
    // restore the provider in the slotted content, pause and clear it.
    if (isWebComponentSelector) {
      isNextInSlottedPosition = true;
      webComponentSymbol = Symbol('web-component');
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
    if (type === 'HTML') {
      controller.enqueue(props.html, suspenseId);
      continue;
    }

    // Register slot to active context providers
    if (type === 'slot') {
      registerSlotToActiveProviders(props.name ?? '', request);
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
      const hasActions = type?._hasActions;
      const processedProps = processServerComponentProps(
        props,
        componentProps,
        controller,
      );
      const componentContent = { component: type, props: processedProps };
      const isSuspenseComponent =
        controller.applySuspense && isComponent(type.suspense);

      if (isSuspenseComponent) {
        const id = controller.nextSuspenseIndex();

        controller.startTag(`<div id="S:${id}">`, suspenseId);

        await enqueueComponent(
          { component: type.suspense, props: processedProps },
          request,
          controller,
          suspenseId,
          isNextInSlottedPosition,
        );

        await controller.endTag(`</div>`, suspenseId);

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

      // Open tag useful for a rerenderInAction to know the component
      if (hasActions) {
        controller.generateComponentId();
        controller.enqueue(
          `<!--o:${controller.getComponentId()}-->`,
          suspenseId,
        );
      }

      const res = await enqueueComponent(
        componentContent,
        request,
        controller,
        suspenseId,
        isNextInSlottedPosition,
      );

      // Close tag useful for a rerenderInAction to know the component
      if (hasActions) {
        controller.enqueue(
          `<!--c:${controller.getComponentId()}-->`,
          suspenseId,
        );
        controller.removeComponentId();
      }

      manageContextProviderCompletion();

      return res;
    }

    if (controller.insideHeadTag && controller.hasId(props.id)) return;
    if (controller.insideHeadTag && props.id) controller.addId(props.id);

    const attributes = renderAttributes({
      elementProps: props,
      request,
      type,
      componentProps,
      componentID: controller.getComponentId(),
    });
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
    if (type === 'head') {
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

    // Add global styles inside Declarative Shadow DOM of Web Components
    else if (
      type === 'template' &&
      props.shadowrootmode === 'open' &&
      !props.__skipGlobalCSS
    ) {
      controller.enqueue(controller.styleSheetsChunks.join(''), suspenseId);
    }

    // Node Content
    await enqueueChildren(
      props.children,
      request,
      controller,
      suspenseId,
      isNextInSlottedPosition,
      componentProps,
    );

    // Close head tag
    if (type === 'head') {
      controller.enqueue(generateHrefLang(request), suspenseId);
      controller.hasHeadTag = true;
      controller.insideHeadTag = false;

      // Script to unsuspense all suspense components
      if (controller.hasUnsuspense) {
        controller.enqueue(
          `<script src="${compiledPagesPath}/_unsuspense-${VERSION_HASH}.js"></script>`,
          suspenseId,
        );
      }
      if (controller.hasActionRPC) {
        controller.enqueue(
          `<script src="${compiledPagesPath}/_rpc-${VERSION_HASH}.js"></script>`,
          suspenseId,
        );
      }
    }

    // StyleSheets: save to use it inside Declarative Shadow DOM of Web Components
    else if (
      type === 'link' &&
      props.rel === 'stylesheet' &&
      controller.insideHeadTag
    ) {
      controller.styleSheetsChunks.push(
        `<link rel="stylesheet" href="${props.href}"></link>`,
      );
    }

    // Close body tag
    else if (type === 'body') {
      // Brisa error dialog for development
      if (IS_DEVELOPMENT && IS_SERVE_PROCESS) {
        controller.enqueue(
          '<brisa-error-dialog skipSSR></brisa-error-dialog>',
          suspenseId,
        );
      }

      const clientFile = request.route?.filePath
        ?.replace('/pages', '/pages-client')
        ?.replace('.js', '.txt');

      // Transfer store to client
      controller.transferStoreToClient(suspenseId);

      // Client file
      if (fs.existsSync(clientFile!)) {
        const hash = await Bun.file(clientFile).text();
        const filename = request.route.src.replace('.js', `-${hash}.js`);
        const { locale } = request.i18n;

        // Script to load the i18n page content (messages and translated pages to navigate)
        if (locale) {
          const filenameI18n = filename.replace('.js', `-${locale}.js`);
          const pathPageI18n = path.join(
            BUILD_DIR,
            'pages-client',
            filenameI18n,
          );
          const i18nFile = Bun.file(pathPageI18n);

          if (await i18nFile.exists()) {
            let script = `<script src="${compiledPagesPath}/${filenameI18n}"></script>`;

            // Script to override client translations caused by "overrideMessages" function
            if (request.store.has('_messages')) {
              const clientI18nMessagesCode = (await i18nFile.text()).replace(
                /^window.i18nMessages ?=/,
                'return ',
              );

              const scriptContent = JSON.stringify(
                overrideClientTranslations(
                  new Function(clientI18nMessagesCode)(),
                  request.store.get('_messages'),
                ),
              );

              script = `<script>window.i18nMessages=${scriptContent}</script>`;
            }

            controller.enqueue(script, suspenseId);
          }
        }

        controller.areSignalsInjected = true;
        controller.enqueue(
          `<script async fetchpriority="high" src="${compiledPagesPath}/${filename}"></script>`,
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
    await controller.endTag(isTagToIgnore ? null : `</${type}>`, suspenseId);
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
  )) as AsyncGenerator;

  injectCSS(controller, request, suspenseId);

  // Async generator list
  if (typeof componentValue.next === 'function') {
    for await (const val of componentValue) {
      injectCSS(controller, request, suspenseId);

      await enqueueChildren(
        val as JSX.Element,
        request,
        controller,
        suspenseId,
        isSlottedPosition,
        props,
      );
    }
    return;
  }

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
      props,
    );
  }

  return enqueueDuringRendering(
    componentValue,
    request,
    controller,
    suspenseId,
    isSlottedPosition,
    props,
  );
}

async function enqueueChildren(
  children: JSX.Element[] | JSX.Element,
  request: RequestContext,
  controller: Controller,
  suspenseId?: number,
  isSlottedPosition = false,
  componentProps?: Props,
): Promise<void> {
  if (Array.isArray(children)) {
    await enqueueArrayChildren(
      children,
      request,
      controller,
      suspenseId,
      isSlottedPosition,
      componentProps,
    );
  } else if (typeof children === 'object') {
    await enqueueDuringRendering(
      children,
      request,
      controller,
      suspenseId,
      isSlottedPosition,
      componentProps,
    );
  } else if (typeof children?.toString === 'function') {
    await controller.enqueue(Bun.escapeHTML(children.toString()), suspenseId);
  }
}

async function enqueueArrayChildren(
  children: JSX.Element[],
  request: RequestContext,
  controller: Controller,
  suspenseId?: number,
  isSlottedPosition = false,
  componentProps?: Props,
): Promise<void> {
  for (const child of children) {
    if (Array.isArray(child)) {
      await enqueueArrayChildren(
        child,
        request,
        controller,
        suspenseId,
        isSlottedPosition,
        componentProps,
      );
    } else {
      await enqueueDuringRendering(
        child,
        request,
        controller,
        suspenseId,
        isSlottedPosition,
        componentProps,
      );
    }
  }
}

function isComponent(type: unknown): boolean {
  return typeof type === 'function';
}

function getValueOfComponent(
  componentFn: ComponentType,
  props: Props,
  request: RequestContext,
) {
  return Promise.resolve()
    .then(() => componentFn(props, request) ?? '')
    .catch((error: Error) => {
      if (isNotFoundError(error) || isNavigateThrowable(error)) {
        throw error;
      }
      if (!isComponent(componentFn.error)) {
        const isWebComponent = (componentFn as any).__isWebComponent;
        const componentName =
          (isWebComponent ? props.selector : componentFn.name) || 'Component';
        const title = `Error in SSR of ${componentName} component with props ${JSON.stringify(
          props,
        )}`;
        logError({
          req: request,
          messages: [title, error.message],
          stack: error.stack,
          docTitle: 'Documentation about SSR',
          docLink: isWebComponent
            ? 'https://brisa.build/building-your-application/components-details/web-components.html#server-side-rendering'
            : 'https://brisa.build/building-your-application/components-details/server-components.html',
        });

        // Should not throw error to avoid breaking the rendering
        return '';
      }
      return componentFn.error({ error, ...props }, request);
    });
}

async function isInPathList(pathname: string, request: RequestContext) {
  const { BUILD_DIR } = getConstants();
  const listFile = Bun.file(pathname);
  const listText = (await listFile.exists()) ? await listFile.text() : '';

  if (!listText) return false;

  const route = (request.route?.filePath ?? '').replace(BUILD_DIR, '');

  return new Set(listText.split('\n')).has(route);
}

function injectCSS(
  controller: Controller,
  request: RequestContext,
  suspenseId?: number,
) {
  if ((request as any)._style) {
    controller.enqueue(
      `<style>${toInline((request as any)._style)}</style>`,
      suspenseId,
    );
    (request as any)._style = '';
  }
}
