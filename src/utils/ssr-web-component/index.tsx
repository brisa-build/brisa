import { toInline } from "@/helpers";
import { Fragment } from "@/jsx-runtime";
import { RequestContext } from "@/types";

type Props = {
  Component: any;
  selector: string;
  [key: string]: any;
};

const voidFn = () => {};

export default async function SSRWebComponent(
  { Component, selector, ...props }: Props,
  { store, useContext }: RequestContext,
) {
  let style = "";
  let Selector = selector;

  const webContext = {
    store,
    state: (value: unknown) => ({ value }),
    effect: voidFn,
    onMount: voidFn,
    derived: (fn: () => unknown) => ({ value: fn() }),
    cleanup: voidFn,
    useContext,
    css: (template: TemplateStringsArray, ...values: string[]) => {
      style += String.raw(
        template,
        ...values.map((v: unknown) => (typeof v === "function" ? v() : v)),
      );
    },
  } as unknown as RequestContext;

  const componentProps = { ...props, children: <slot /> };
  let content: any;

  try {
    content = await (typeof Component.suspense === "function"
      ? Component.suspense(componentProps, webContext)
      : Component(componentProps, webContext));
  } catch (error) {
    if (Component.error) {
      content = await Component.error({ ...componentProps, error }, webContext);
    } else {
      throw error;
    }
  }

  return (
    <Selector {...props} __isWebComponent>
      <template shadowrootmode="open">
        {content}
        {style.length > 0 && <style>{toInline(style)}</style>}
      </template>
      <Fragment slot="">{props.children}</Fragment>
    </Selector>
  );
}

SSRWebComponent.__isWebComponent = true;
