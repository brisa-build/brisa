import type { WebContext } from "@/types";

type Props = {
  children: unknown;
  value: any;
  context: {
    id: string;
    defaultValue: any;
  };
  cid?: string;
  pid?: string;
};

export default function ClientContextProvider(
  { children, context, value, pid, cid }: Props,
  { effect, self, store, cleanup }: WebContext,
) {
  const cId = cid ?? context?.id;
  let pId = pid;

  if (!pId) {
    pId = (window._pid ?? -1) + 1;
    window._pid = pId;
  }

  effect(() => {
    self!.setAttribute("cid", cId);
    self!.setAttribute("pid", pId + "");
    store.set(`context:${cId}:${pId}`, value ?? context?.defaultValue);
  });

  // Remove without reactivity
  cleanup(() => {
    store.Map.delete(cId);
  });

  return children;
}
