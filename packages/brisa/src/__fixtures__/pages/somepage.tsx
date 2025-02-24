// @ts-nocheck
import { createContext } from '@/core';
import type { RequestContext, ResponseHeaders } from '@/types';

const context = createContext('foo');

export default async function SomePage() {
  return (
    <context-provider serverOnly context={context} value="bar">
      <h1>Some page</h1>
      {/* @ts-ignore */}
      <with-link />
    </context-provider>
  );
}

export function responseHeaders(
  request: RequestContext,
  { headersSnapshot }: ResponseHeaders,
) {
  return headersSnapshot({
    'x-test': 'test',
    'x-initiator': request.initiator,
  });
}
