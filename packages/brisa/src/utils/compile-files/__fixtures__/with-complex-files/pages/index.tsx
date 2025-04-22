import type { RequestContext, ResponseHeaders } from '@/types';

export default async function Home({}, { i18n }: RequestContext) {
  return (
    <div onClick={() => console.log('hello world')} data-action>
      {i18n.t('hello-world')}
    </div>
  );
}

Home.suspense = () => {
  return (
    <div onClick={() => console.log('Hello from suspense')}>Loading...</div>
  );
};

export async function responseHeaders(
  _: RequestContext,
  { headersSnapshot }: ResponseHeaders,
) {
  return headersSnapshot({
    'x-test': 'test',
  });
}
