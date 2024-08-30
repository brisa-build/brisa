import { jsx } from 'brisa/jsx-runtime';

export default function PageWithWebComponent() {
  return jsx('div', {
    children: [
      jsx('h1', { children: 'Page with web component' }),
      jsx('web-component', {}),
      jsx('emoji-picker', {}),
    ],
  });
}
