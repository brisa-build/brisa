import { toInline } from "../../helpers";
import { RequestContext } from "../../types";

type Props = {
  Component: any;
  selector: string;
  [key: string]: any;
};

const voidFn = () => {};

export default async function SSRWebComponent({
  Component,
  selector,
  ...props
}: Props) {
  let style = "";
  let Selector = selector;

  const webContext = {
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
  } catch (err) {
    if (Component.error) {
      content = await Component.error(err, componentProps, webContext);
    } else {
      throw err;
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
