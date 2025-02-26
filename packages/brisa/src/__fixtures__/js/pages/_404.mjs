import { jsx } from 'brisa/jsx-runtime';

export const Head = () => {
  return jsx('title', { id: 'title', children: 'Page not found' });
};

export default async function _404() {
  return jsx('h1', {
    children: ['Page not found 404', jsx('web-component', {})],
  });
}
