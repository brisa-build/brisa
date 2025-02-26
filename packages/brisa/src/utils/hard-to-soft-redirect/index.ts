import type { RenderMode, RequestContext } from '@/types';
import { resolveStore } from '../transfer-store-service';
import type { InitiatorType } from '@/types/server';

type HardToSoftRedirectParams = {
  req: RequestContext;
  location: string;
  mode?: RenderMode;
  res?: Response;
};

const SPA_INITIATORS = new Set<keyof InitiatorType>([
  'SPA_NAVIGATION',
  'SERVER_ACTION',
]);

export default function hardToSoftRedirect({
  req,
  location,
  mode,
  res,
}: HardToSoftRedirectParams) {
  const headers = new Headers(res?.headers);

  headers.set('Content-Type', 'application/json');
  headers.set('X-Navigate', location);
  headers.delete('Location');

  if (mode) headers.set('X-Mode', mode);

  return new Response(resolveStore(req), { status: 200, headers });
}

export function handleSPARedirects(req: RequestContext, res: Response) {
  const isSPASoftRedirect =
    SPA_INITIATORS.has(req?.initiator) &&
    res?.status >= 300 &&
    res?.status < 400;

  return isSPASoftRedirect
    ? hardToSoftRedirect({ req, location: res.headers.get('Location')!, res })
    : res;
}
