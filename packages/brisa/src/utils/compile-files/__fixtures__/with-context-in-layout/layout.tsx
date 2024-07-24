import { Ctx } from './context';

export default function Layout({ children }: { children: JSX.Element }) {
  return (
    <html>
      <head>
        <title id="title">CUSTOM LAYOUT</title>
      </head>
      <body>
        <context-provider context={Ctx} value="foo">
          {/* @ts-ignore */}
          <layout-web-component />
        </context-provider>
        {children}
      </body>
    </html>
  );
}
