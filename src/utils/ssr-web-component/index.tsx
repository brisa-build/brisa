import { toInline } from "../../helpers";
import { RequestContext } from "../../types";

type Props = {
  Component: any;
  selector: string;
  [key: string]: any;
};

const voidFn = () => {};

export default async function SSRWebComponent(
  { Component, selector, ...props }: Props,
  { store }: RequestContext,
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
    css: (strings: string[], ...values: string[]) => {
      style += strings[0] + values.join("");
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
    <Selector {...props}>
      <template shadowrootmode="open">
        {content}
        {style.length > 0 && <style>{toInline(style)}</style>}
      </template>
      {props.children}
    </Selector>
  );
}
