import type { RequestContext } from '@/types';
import { PREFIX_MESSAGE, SUFFIX_MESSAGE } from '@/utils/rerender-in-action';
import responseRenderedPage from '@/utils/response-rendered-page';
import getRouteMatcher from '@/utils/get-route-matcher';
import { getConstants } from '@/constants';
import { logError } from '@/utils/log/log-build';
import { getNavigateMode, isNavigateThrowable } from '@/utils/navigate/utils';
import renderToReadableStream from '@/utils/render-to-readable-stream';
import getPageComponentWithHeaders from '@/utils/get-page-component-with-headers';
import { isNotFoundError } from '@/utils/not-found';
import { isRerenderThrowable } from '@/utils/rerender-in-action/is-rerender-throwable';
import handleI18n from '../handle-i18n';
import redirectTrailingSlash from '../redirect-trailing-slash';
import hardToSoftRedirect from '../hard-to-soft-redirect';

type ResolveActionParams = {
  req: RequestContext;
  error: Error;
  actionId: string;
  component: (props: unknown) => JSX.Element;
};

type Dependencies = [string, string, string][][];

const DEPENDENCIES = Symbol.for('DEPENDENCIES');

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
    return hardToSoftRedirect({
      req,
      location: formatNavigateDestination(error.message, req),
      mode: getNavigateMode(error),
    });
  }

  // Redirect to 404 page
  if (isNotFoundError(error)) {
    url.searchParams.set('_not-found', '1');

    return hardToSoftRedirect({
      req,
      location: url.toString(),
    });
  }

  // Error not caught
  if (!isRerenderThrowable(error)) {
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

  const options = JSON.parse(
    error.message.replace(PREFIX_MESSAGE, '').replace(SUFFIX_MESSAGE, ''),
  );

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
  const element = (error as any)[Symbol.for('element')];
  const props: Record<string, any> = {};

  const actionValue = Object.assign(() => {}, {
    actionId,
    actions: dependencies,
    cid: componentId,
  });

  for (const deps of dependencies?.[0] ?? []) {
    props[deps[0]] = actionValue;
  }

  const { pageHeaders } = await getPageComponentWithHeaders({ req, route });
  const stream = await renderToReadableStream(element ?? component(props), {
    request: req,
    isPage: false,
  });

  pageHeaders.set('X-Mode', options.renderMode);
  pageHeaders.set('X-Type', options.type);
  pageHeaders.set('X-Target', options.target ?? 'component');
  pageHeaders.set('X-Placement', options.placement ?? 'replace');
  if (componentId) pageHeaders.set('X-Cid', componentId);

  return new Response(stream, {
    status: 200,
    headers: pageHeaders,
  });
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

function formatNavigateDestination(
  message: string,
  req: RequestContext,
): string {
  // Handle i18n (localization) redirection if needed
  req.finalURL = new URL(message, req.finalURL).toString();
  const { response } = handleI18n(req);
  let url = response?.headers.get('Location') ?? message;

  // Handle trailing slash redirection if needed
  const urlObj = new URL(url, req.finalURL);
  req.finalURL = urlObj.toString();
  const trailingSlashResponse = redirectTrailingSlash(req);
  url = trailingSlashResponse?.headers.get('Location') ?? url;

  return url.replace(urlObj.origin, '');
}
