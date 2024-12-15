export { default as SSRWebComponent } from '@/utils/ssr-web-component';
export { default as resolveAction } from '@/utils/resolve-action';
export { default as renderToReadableStream } from '@/utils/render-to-readable-stream';
export { default as renderToString } from '@/utils/render-to-string';
export { renderPage, renderComponent } from '@/utils/rerender-in-action';
export { getServeOptions } from '@/cli/serve/serve-options';
export { Initiator } from '@/public-constants';
export { fileSystemRouter } from '@/utils/file-system-router';
export { encrypt, decrypt } from '@/utils/crypto';
export { default as serve } from '@/cli/serve/bun-serve';
export const getServer = () => globalThis.brisaServer;

// TODO: Remove it in future releases
export const rerenderInAction = () => {
  console.warn(
    '🚨 BREAKING CHANGE: rerenderInAction is not more supported. You need to replace it to renderPage() or renderComponent() methods.',
  );
  console.log(
    '👉 renderPage(): http://brisa.build/api-reference/server-apis/renderPage',
  );
  console.log(
    '👉 renderComponent(): http://brisa.build/api-reference/server-apis/renderComponent',
  );
};
