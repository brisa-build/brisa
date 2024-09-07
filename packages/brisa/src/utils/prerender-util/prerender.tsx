import dangerHTML from '../danger-html';
import { boldLog } from '../log/log-color';
import path from 'node:path';
import renderToString from '../render-to-string';
import { getConstants } from '@/constants';
import resolveImportSync from '../resolve-import-sync';

type PrerenderParams = {
  componentPath: string;
  componentModuleName?: string;
  dir?: string;
  componentProps?: Record<string, unknown>;
  brisaServerPath?: string;
};

async function prerender({
  componentPath,
  dir,
  componentModuleName = 'default',
  componentProps = {},
  brisaServerPath = path.join(import.meta.dirname, '..', 'server'),
}: PrerenderParams) {
  const { LOG_PREFIX, SRC_DIR } = getConstants();
  const isWebComponent =
    componentPath === 'brisa/server' &&
    typeof componentProps.Component === 'string' &&
    componentProps.selector;
  const relativeDir = dir?.replace(SRC_DIR, '') || '';
  let componentRelative = componentPath.replace(SRC_DIR, '');

  // SSR of Web Components
  if (isWebComponent) {
    componentPath = brisaServerPath;
    componentProps.Component = resolveImportSync(
      componentProps.Component as string,
      dir,
    );
    componentRelative = (componentProps.Component as string).replace(
      SRC_DIR,
      '',
    );
  }

  try {
    const Component = (await import(resolveImportSync(componentPath, dir)))[
      componentModuleName
    ];
    const start = Date.now();
    console.log(
      LOG_PREFIX.WAIT,
      ` - prerendering ${componentRelative} on ${relativeDir}...`,
    );
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
      `Failed to prerender ${componentRelative} on ${relativeDir}: ${boldLog(String(e))}`,
    );
  }
}

export const __prerender__macro = prerender;
