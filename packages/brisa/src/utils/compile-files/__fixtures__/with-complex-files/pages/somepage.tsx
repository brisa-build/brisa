import type { ResponseHeaders } from '@/types';
import { createContext } from '@/core';

const context = createContext('foo');

export default async function SomePage() {
  return (
    <context-provider serverOnly context={context} value="bar">
      <h1>Some page</h1>
    </context-provider>
  );
}

export function responseHeaders(_: any, { headersSnapshot }: ResponseHeaders) {
  return headersSnapshot({
    'x-test': 'test',
  });
}
