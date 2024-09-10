// @ts-nocheck
import type { RequestContext } from '@/types';

export default function Layout(
  { children }: { children: JSX.Element },
  { i18n }: RequestContext,
) {
  return (
    <html>
      <head>
        <title id="title">CUSTOM LAYOUT</title>
      </head>
      <body>
        {i18n.t('server-key')}
        <layout-web-component />
        {children}
      </body>
    </html>
  );
}
