import type { RequestContext } from '@/types';
import { PREFIX_MESSAGE, SUFFIX_MESSAGE } from '@/utils/rerender-in-action';
import responseRenderedPage from '@/utils/response-rendered-page';
import getRouteMatcher from '@/utils/get-route-matcher';
import { getConstants } from '@/constants';
import { logError } from '@/utils/log/log-build';
import { AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL } from '@/utils/ssr-web-component';
import { getNavigateMode, isNavigateThrowable } from '@/utils/navigate/utils';
import renderToReadableStream from '@/utils/render-to-readable-stream';
import getPageComponentWithHeaders from '@/utils/get-page-component-with-headers';
import { getTransferedServerStoreToClient } from '@/utils/transfer-store-service';

type ResolveActionParams = {
  req: RequestContext;
  error: Error;
  actionId: string;
  component: (props: unknown) => JSX.Element;
};

type Dependencies = [string, string, string][][];

const DEPENDENCIES = Symbol.for('DEPENDENCIES');

/**
 *
 * This method is called inside the catch block of the action function.
 */
export default async function resolveAction({
  req,
  error,
  actionId,
  component,
}: ResolveActionParams) {
  const { PAGES_DIR, RESERVED_PAGES } = getConstants();
  const url = new URL(req.headers.get('referer') ?? '', req.url);

  // Navigate to another page
  if (isNavigateThrowable(error)) {
    return new Response(resolveStore(req), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Navigate': error.message,
        'X-Mode': getNavigateMode(error),
      },
    });
  }

  // Redirect to 404 page
  if (error.name === 'NotFoundError') {
    url.searchParams.set('_not-found', '1');

    return new Response(resolveStore(req), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Navigate': url.toString(),
      },
    });
  }

  // Error not caught
  if (error.name !== 'rerender') {
    logError({
      stack: error.stack,
      messages: [
        `There was an error executing the server action: ${error.message}`,
        `Please note that for security reasons Brisa does not automatically expose server data on the client. If you need to access props or store fields that you had during rendering, you need to transfer it with store.transferToClient, and decide whether to use encrypt or not.`,
        '',
        'TIP 💡: You can use props that are other server actions to call server actions nested between server components. These are the only props available and the only thing that is exposed on the client is an auto-generated id.',
      ],
      docTitle: 'Documentation about Server actions',
      docLink:
        'https://brisa.build/building-your-application/data-management/server-actions#props-in-server-actions',
      req,
    });

    return new Response(error.message, { status: 500 });
  }

  // @ts-ignore
  const isOriginalAction = req._originalActionId === actionId;
  const options = JSON.parse(
    error.message.replace(PREFIX_MESSAGE, '').replace(SUFFIX_MESSAGE, ''),
  );

  // Return error to be captured on the response-action withResolvers
  if (!isOriginalAction && options.type === 'targetComponent') {
    throw error;
  }

  const pagesRouter = getRouteMatcher(
    PAGES_DIR,
    RESERVED_PAGES,
    req.i18n?.locale,
  );

  const { route, isReservedPathname } = pagesRouter.match(req);

  if (!route || isReservedPathname) {
    const typeText = options.type === 'page' ? '' : 'component on ';
    const errorMessage = `Error rerendering ${typeText}page ${url}. Page route not found`;
    logError({ messages: [errorMessage], req });
    return new Response(errorMessage, { status: 404 });
  }

  // Rerender page:
  if (options.type === 'page') {
    const res = await responseRenderedPage({ req, route });
    res.headers.set('X-Mode', options.renderMode);
    res.headers.set('X-Type', 'page');
    return res;
  }

  // Rerender only component (not page):
  const dependencies = req.store.get(DEPENDENCIES);
  const componentId = extractComponentId(dependencies, actionId);
  // @ts-ignore
  const props = error[Symbol.for('props')] ?? {};
  const actionValue = Object.assign(() => {}, {
    actionId,
    actions: dependencies,
    cid: componentId,
  });

  for (const deps of dependencies?.[0] ?? []) {
    props[deps[0]] = actionValue;
  }

  const { pageHeaders } = await getPageComponentWithHeaders({ req, route });
  const stream = await renderToReadableStream(component(props), {
    request: req,
    isPage: false,
  });

  pageHeaders.set('X-Mode', options.renderMode);
  pageHeaders.set('X-Type', options.type);
  if (componentId) pageHeaders.set('X-Cid', componentId);

  return new Response(stream, {
    status: 200,
    headers: pageHeaders,
  });
}

export function resolveStore(req: RequestContext) {
  return JSON.stringify([...getTransferedServerStoreToClient(req)]);
}

function extractComponentId(dependencies: Dependencies, actionId: string) {
  for (const actions of dependencies ?? []) {
    for (const action of actions ?? []) {
      if (action[1] === actionId) {
        return action[2];
      }
    }
  }
  return null;
}
