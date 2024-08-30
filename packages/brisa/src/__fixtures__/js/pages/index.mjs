import { jsx } from 'brisa/jsx-runtime';

export default async function Home({}, { i18n }) {
  return jsx('div', {
    onClick: () => console.log('hello world'),
    'data-action': true,
    children: i18n.t('hello-world'),
  });
}

Home.suspense = () => {
  return jsx('div', {
    onClick: () => console.log('Hello from suspense'),
    children: 'Loading...',
  });
};

export async function responseHeaders(req, status) {
  return {
    'x-test': status === 500 ? 'fail' : 'success',
  };
}
