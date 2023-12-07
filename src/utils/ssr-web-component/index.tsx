import { toInline } from "../../helpers";
import { RequestContext } from "../../types";

type Props = {
  Component: any;
  selector: string;
  [key: string]: any;
};

const voidFn = () => {};

export default function SSRWebComponent({
  Component,
  selector,
  ...props
}: Props) {
  let style = "";
  let Selector = selector;

  return (
    <Selector {...props}>
      <template shadowrootmode="open">
        {Component({ ...props, children: <slot /> }, {
          state: (value: unknown) => ({ value }),
          effect: voidFn,
          onMount: voidFn,
          derived: (fn: () => unknown) => ({ value: fn() }),
          cleanup: voidFn,
          css: (strings: string[], ...values: string[]) => {
            style += strings[0] + values.join("");
          },
        } as unknown as RequestContext)}
        {style.length > 0 && <style>{toInline(style)}</style>}
      </template>
      {props.children}
    </Selector>
  );
}
