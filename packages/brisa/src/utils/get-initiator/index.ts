import { Initiator } from '@/public-constants';
import type { RequestContext } from '@/types';

export default function getInitiator(req: RequestContext) {
  const firstPathnamePart = new URL(req.finalURL).pathname.split('/')[
    req.i18n.locale ? 2 : 1
  ];

  if (firstPathnamePart === 'api') return Initiator.API_REQUEST;
  if (req.method !== 'POST') return Initiator.INITIAL_REQUEST;
  if (req.headers.has('x-action')) return Initiator.SERVER_ACTION;

  return Initiator.SPA_NAVIGATION;
}
