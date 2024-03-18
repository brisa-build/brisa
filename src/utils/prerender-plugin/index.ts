import type { BunPlugin } from "bun";

type PrerenderPluginParams = {
  renderToString: (element: JSX.Element) => string;
  injectStringIntoJSX: (string: string) => JSX.Element;
};

const filter = new RegExp(`*.(ts|js)x$`);

export default function prerenderPlugin({
  renderToString,
  injectStringIntoJSX,
}: PrerenderPluginParams) {
  return {
    name: "prerender-plugin",
    setup(build) {
      build.onLoad({ filter }, async ({ path, loader }) => ({
        contents: prerenderPluginTransformation(await Bun.file(path).text()),
        loader,
      }));
    },
  } satisfies BunPlugin;
}

/**
 *
 * import { prerender } from "@/utils/prerender" with { type: 'macro' };
 *
 * {prerender('@/components/static-component', 'default')}
 *
 * import { dangerHTML } from 'brisa';
 * import { renderToReadableStream } from 'brisa/server';
 *
 * export async function prerender(componentPath: string, moduleName = 'default', props = {}) {
 *   const Component = (await import(componentPath))[moduleName];
 *   const stream = renderToReadableStream(<Component {...props} />, { request: new Request('http://localhost') });
 *   return dangerHTML(await Bun.readableStreamToText(stream))
 * }
 */
function prerenderPluginTransformation(code: string) {
  return code;
}
