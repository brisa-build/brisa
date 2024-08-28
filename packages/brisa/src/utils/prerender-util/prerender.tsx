import renderToString from '../render-to-string';
import constants from '@/constants';

const { LOG_PREFIX, SRC_DIR } = constants;

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
    const componentRelative = componentPath.replace(SRC_DIR, '');
    const Component = (await import(componentPath))[componentModuleName];
    const start = Date.now();
    console.log(LOG_PREFIX.WAIT, ` - prerendering ${componentRelative}...`);
    const html = await renderToString(<Component {...componentProps} />);
    const ms = Date.now() - start;
    console.log(
      LOG_PREFIX.INFO,
      LOG_PREFIX.TICK,
      `Prerendered successfully in ${ms}ms!`,
    );
    return html;
  } catch (e) {
    console.error(e);
  }
}

export const __prerender__macro = prerender;
