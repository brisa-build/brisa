import { jsx } from 'brisa/jsx-runtime';
import { createContext } from '@/core';

const context = createContext('foo');

export default async function SomePage() {
  return jsx('context-provider', {
    context,
    value: 'bar',
    chidren: jsx('h1', { children: 'Some page' }),
  });
}
