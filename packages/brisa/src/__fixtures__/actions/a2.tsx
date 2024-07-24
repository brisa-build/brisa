import type { RequestContext } from '@/types';

export async function a2_1({ onAction }: any) {
  return 'a2_1' + ((await onAction?.('foo')) ?? '');
}

export function a2_2({}, req: RequestContext) {
  const foo = req.store.get('__params:a2_2')[0];
  return '-a2_2-' + foo;
}
