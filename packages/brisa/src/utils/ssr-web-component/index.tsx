import { toInline } from "@/helpers";
import { Fragment } from "@/jsx-runtime";
import type {
  JSXNode,
  JSXElement,
  JSXComponent,
  RequestContext,
} from "@/types";
import { getConstants } from "@/constants";

export const AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL = Symbol.for(
  "AVOID_DECLARATIVE_SHADOW_DOM",
);

type SSRWebComponentProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
  Component: JSXComponent;
  selector: string;
  children?: JSXElement;
};

const voidFn = () => {};
function isPromise<T>(v: unknown): v is Promise<T> {
  return (
    typeof v === "object" &&
    v !== null &&
    "then" in v &&
    typeof v.then === "function"
  );
}

export default async function SSRWebComponent<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  { Component, selector, children, ...props }: SSRWebComponentProps<T>,
  { store, useContext, i18n, indicate }: RequestContext,
): Promise<JSXNode> {
  const { WEB_CONTEXT_PLUGINS } = getConstants();
  const showContent = !store.has(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL);
  let style = "";
  let Selector = selector;

  // @ts-expect-error -- TODO explanation
  store.setOptimistic = voidFn;

  const webContext = {
    store,
    state: (value: unknown) => ({ value }),
    effect: voidFn,
    onMount: voidFn,
    reset: voidFn,
    derived: (fn: () => unknown) => ({ value: fn() }),
    cleanup: voidFn,
    indicate,
    useContext,
    i18n,
    css: (template: TemplateStringsArray, ...values: string[]) => {
      style += String.raw(
        template,
        ...values.map((v: unknown) => (typeof v === "function" ? v() : v)),
      );
    },
  } as unknown as RequestContext;

  for (const plugin of WEB_CONTEXT_PLUGINS) {
    Object.assign(webContext, plugin(webContext));
  }

  const componentProps = { ...props, children: <slot /> };
  let content: JSXNode | null = null;
  if (showContent) {
    try {
      const maybePromise =
        typeof Component.suspense === "function"
          ? Component.suspense(componentProps, webContext)
          : Component(componentProps, webContext);

      content = isPromise<JSXNode>(maybePromise)
        ? await maybePromise
        : maybePromise;
    } catch (error) {
      if (Component.error) {
        content = await Component.error(
          { ...componentProps, error },
          webContext,
        );
      } else {
        throw error;
      }
    }
  }

  return (
    <Selector {...props} __isWebComponent>
      {showContent && (
        <template shadowrootmode="open">
          {content}
          {style.length > 0 && <style>{toInline(style)}</style>}
        </template>
      )}
      <Fragment slot="">{children}</Fragment>
    </Selector>
  );
}

SSRWebComponent.__isWebComponent = true;
