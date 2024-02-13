import { toInline } from "@/helpers";
import { Fragment } from "@/jsx-runtime";
import { type RequestContext } from "@/types";
import { getConstants } from "@/constants";

export const AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL = Symbol.for(
  "AVOID_DECLARATIVE_SHADOW_DOM",
);

type Props = {
  Component: any;
  selector: string;
  [key: string]: any;
};

const voidFn = () => {};

export default async function SSRWebComponent(
  { Component, selector, ...props }: Props,
  { store, useContext, i18n }: RequestContext,
) {
  const { WEB_CONTEXT_PLUGINS } = getConstants();
  const showContent = !store.has(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL);
  let style = "";
  let Selector = selector;

  const webContext = {
    store,
    state: (value: unknown) => ({ value }),
    effect: voidFn,
    onMount: voidFn,
    reset: voidFn,
    derived: (fn: () => unknown) => ({ value: fn() }),
    cleanup: voidFn,
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
  let content: any;

  if (showContent) {
    try {
      content = await (typeof Component.suspense === "function"
        ? Component.suspense(componentProps, webContext)
        : Component(componentProps, webContext));
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
      <Fragment slot="">{props.children}</Fragment>
    </Selector>
  );
}

SSRWebComponent.__isWebComponent = true;
