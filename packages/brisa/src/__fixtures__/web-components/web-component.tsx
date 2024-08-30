import type { WebContext } from '@/types';

export default function WebComponent({}, { i18n, store }: WebContext) {
  console.log(process.env.BRISA_PUBLIC_TEST, i18n.t('hello'));
  return (
    <>
      {/* @ts-ignore */}
      <native-some-example />
      {store.get('foo')}
    </>
  );
}
