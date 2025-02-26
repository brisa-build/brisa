// @ts-nocheck
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
  req: RequestContext,
  { responseStatus, headersSnapshot }: ResponseHeaders,
) {
  return headersSnapshot({
    'x-test': responseStatus === 500 ? 'fail' : 'success',
  });
}
