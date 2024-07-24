import type { WebContext } from '@/types';

export default function WebComponent({}, { i18n }: WebContext) {
  console.log(process.env.BRISA_PUBLIC_TEST, i18n.t('hello'));
  // @ts-ignore
  return <native-some-example />;
}
