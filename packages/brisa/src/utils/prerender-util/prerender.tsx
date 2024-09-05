import dangerHTML from '../danger-html';
import { boldLog } from '../log/log-color';
import renderToString from '../render-to-string';
import constants from '@/constants';
import resolveImportSync from '../resolve-import-sync';

const { LOG_PREFIX, SRC_DIR } = constants;

type PrerenderParams = {
  componentPath: string;
  componentModuleName?: string;
  dir?: string;
  componentProps?: Record<string, unknown>;
};

async function prerender({
  componentPath,
  dir,
  componentModuleName = 'default',
  componentProps = {},
}: PrerenderParams) {
  const componentRelative = componentPath.replace(SRC_DIR, '');

  // SSR of Web Components
  if (typeof componentProps.Component === 'string' && componentProps.selector) {
    componentProps.Component = resolveImportSync(componentProps.Component, dir);
  }

  try {
    const Component = (await import(resolveImportSync(componentPath, dir)))[
      componentModuleName
    ];
    const start = Date.now();
    console.log(LOG_PREFIX.WAIT, ` - prerendering ${componentRelative}...`);
    const html = await renderToString(<Component {...componentProps} />);
    const ms = Date.now() - start;
    console.log(
      LOG_PREFIX.INFO,
      LOG_PREFIX.TICK,
      `Prerendered successfully in ${ms}ms!`,
    );
    return dangerHTML(html);
  } catch (e) {
    console.log(
      LOG_PREFIX.ERROR,
      `Failed to prerender ${componentRelative}: ${boldLog(String(e))}`,
    );
  }
}

export const __prerender__macro = prerender;
