import { createContext } from '@/core';
import { jsx } from 'brisa/jsx-runtime';

const context = createContext('foo');

export default async function SomePage() {
  return jsx('context-provider', {
    serverOnly: true,
    context,
    value: 'bar',
    children: [jsx('h1', { children: 'Some page' }), jsx('with-link', {})],
  });
}

export function responseHeaders(request) {
  return {
    'x-test': 'test',
    'x-renderInitiator': request.renderInitiator,
  };
}
