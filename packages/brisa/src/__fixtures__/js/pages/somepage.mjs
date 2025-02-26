import { jsx } from 'brisa/jsx-runtime';

export default async function SomePage() {
  return jsx('h1', { children: 'Some page' });
}

export function responseHeaders(request, { headersSnapshot }) {
  return headersSnapshot({
    'x-test': 'test',
    'x-initiator': request.initiator,
    cookie: 'test=1; Path=/; Max-Age=3600',
  });
}
