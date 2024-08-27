import renderToString from '../render-to-string';

type PrerenderParams = {
  componentPath: string;
  componentModuleName?: string;
  componentProps?: Record<string, unknown>;
  prerenderConfigPath: string;
};

async function prerender({
  componentPath,
  componentModuleName = 'default',
  componentProps = {},
}: PrerenderParams) {
  try {
    const Component = (await import(componentPath))[componentModuleName];
    return await renderToString(Component, componentProps);
  } catch (e) {
    console.error(e);
  }
}

export const __prerender__macro = prerender;
