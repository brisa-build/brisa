import { toInline } from "../../helpers";
import { Fragment } from "../../jsx-runtime";
import { RequestContext } from "../../types";

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
    css: (strings: string[], ...values: string[]) => {
      style += strings[0] + values.join("");
    },
  } as unknown as RequestContext;

  const componentProps = { ...props, children: <slot /> };

  let content: any;
  let hasSlotContent = false;

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

  // TODO: This is a hack to check if the component has a slot,
  // probably there are a better way to do this
  if (Array.isArray(props.children)) {
    hasSlotContent = props.children.some(
      (child) => typeof child?.props?.slot === "string",
    );
  } else {
    hasSlotContent = typeof props.children?.props?.slot === "string";
  }

  const children = hasSlotContent ? (
    props.children
  ) : (
    <Fragment slot="">{props.children}</Fragment>
  );

  return (
    <Selector {...props}>
      <template shadowrootmode="open">
        {content}
        {style.length > 0 && <style>{toInline(style)}</style>}
      </template>
      {children}
    </Selector>
  );
}
