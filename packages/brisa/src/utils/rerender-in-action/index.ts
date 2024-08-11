import type { RerenderInActionProps } from '@/types/server';
import { blueLog } from '@/utils/log/log-color';

export const PREFIX_MESSAGE = 'Error rerendering within action: ';
export const SUFFIX_MESSAGE = `\n\nPlease use the 'rerenderInAction' function inside a server action without using a try-catch block\nbecause 'rerenderInAction' is a throwable caught by Brisa to rerender the component or page.\n\nMore details: ${blueLog(
  'https://brisa.build/api-reference/server-apis/rerenderInAction#rerenderinaction',
)}`;

const RERENDER_THROWABLE_NAME = 'rerender';

export default function rerenderInAction<T>(
  config: RerenderInActionProps<T> = {},
) {
  const type = config.type ?? 'currentComponent';
  const renderMode = config.renderMode ?? 'reactivity';

  const throwable = new Error(
    `${PREFIX_MESSAGE}${JSON.stringify({ type, renderMode })}${SUFFIX_MESSAGE}`,
  );

  if (type !== 'page') {
    // @ts-ignore
    throwable[Symbol.for('props')] = config.props ?? {};
  }

  throwable.name = RERENDER_THROWABLE_NAME;

  throw throwable;
}

export function isRerenderThrowable(error: Error) {
  return error.name === RERENDER_THROWABLE_NAME;
}
