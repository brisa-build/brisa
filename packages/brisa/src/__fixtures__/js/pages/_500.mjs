import { jsx } from 'brisa/jsx-runtime';

export const Head = () => {
  return jsx('title', { id: 'title', children: 'Some internal error' });
};

export default async function _500() {
  return jsx('h1', {
    children: ['Some internal error', jsx('web-component', {})],
  });
}
