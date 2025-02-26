import type { WebContext } from '@/types';

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
  { effect, self, store, cleanup, onMount }: WebContext,
) {
  const cId = cid ?? context?.id;
  let pId = pid;
  let mounted = false;
  let cleanAfterMount = false;

  if (!pId) {
    pId = (window._pid ?? -1) + 1;
    window._pid = pId;
  }

  const contextId = `context:${cId}:${pId}`;

  effect(() => {
    self.setAttribute('cid', cId);
    self.setAttribute('pid', pId + '');
    store.set(contextId, value ?? context?.defaultValue);
  });

  cleanup(() => {
    if (mounted) store.delete(contextId);
    else cleanAfterMount = true;
  });

  onMount(() => {
    mounted = true;
    if (cleanAfterMount) store.delete(contextId);
  });

  return children;
}
