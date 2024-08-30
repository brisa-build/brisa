import { jsx } from 'brisa/jsx-runtime';

export default function User() {
  return jsx('div', { children: 'user' });
}

export function prerender() {
  return [{ username: 'testUserName' }];
}
