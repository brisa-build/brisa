import type { RenderPageProps, RenderComponentProps } from '@/types/server';
import { blueLog } from '@/utils/log/log-color';

export const PREFIX_MESSAGE = 'Error rerendering within action: ';
export const SUFFIX_MESSAGE = `\n\nPlease use the 'renderPage' / 'renderComponent' function inside a server action without using a try-catch block\nbecause is a throwable caught by Brisa to rerender the component or page.\n\nMore details: ${blueLog(
  'https://brisa.build/api-reference/server-apis/renderPage',
)}`;

export function renderPage(config: RenderPageProps = {}) {
  const renderMode = config.withTransition ? 'transition' : 'reactivity';

  const throwable = new Error(
    `${PREFIX_MESSAGE}${JSON.stringify({ type: 'page', renderMode })}${SUFFIX_MESSAGE}`,
  );

  throwable.name = 'rerender';

  throw throwable;
}

export function renderComponent(config: RenderComponentProps = {}) {
  const target = config.target ?? 'component';
  const renderMode = config.withTransition ? 'transition' : 'reactivity';
  const placement = config.placement ?? 'replace';

  const throwable = new Error(
    `${PREFIX_MESSAGE}${JSON.stringify({ type: 'component', target, renderMode, placement })}${SUFFIX_MESSAGE}`,
  );

  if (config.element) {
    // @ts-ignore
    throwable[Symbol.for('element')] = config.element;
  }

  throwable.name = 'rerender';

  throw throwable;
}
