// @ts-nocheck
import type { MatchedRoute } from 'bun';
import type { I18n, RequestContext, TransferOptions } from '@/types';
import {
  CURRENT_PROVIDER_ID,
  CONTEXT_STORE_ID,
} from '@/utils/context-provider/server';
import { encrypt } from '@/utils/crypto';
import { RenderInitiator } from '@/core/server';

type ExtendRequestContext = {
  originalRequest: Request;
  route?: MatchedRoute;
  store?: RequestContext['store'];
  i18n?: I18n;
  finalURL?: string;
  id?: string;
};

export default function extendRequestContext({
  originalRequest,
  route,
  store,
  webStore,
  i18n,
  finalURL,
  id,
}: ExtendRequestContext): RequestContext {
  // finalURL
  originalRequest.finalURL =
    finalURL ?? originalRequest.finalURL ?? originalRequest.url;

  // route
  originalRequest.route = route ?? originalRequest.route;

  // store
  originalRequest.store =
    store ?? originalRequest.store ?? new Map<string | symbol, any>();

  // webStore (used for store.transferToClient)
  originalRequest.webStore =
    webStore ?? originalRequest.webStore ?? new Map<string | symbol, any>();

  // store.transferToClient
  originalRequest.store.transferToClient = (
    keys: string[],
    options?: TransferOptions,
  ) => {
    for (const key of keys) {
      originalRequest.webStore.set(key, options);
    }
  };

  // useContext
  originalRequest.useContext = (ctx) => {
    const store = originalRequest.store;
    const context = store.get(CONTEXT_STORE_ID)?.get(ctx.id);
    const value = ctx.defaultValue;

    if (!context) return { value };

    const provider = context.get(context.get(CURRENT_PROVIDER_ID));

    if (!provider || provider.isProviderPaused()) return { value };

    return {
      value: provider.value ?? value,
    };
  };

  // id
  originalRequest.id = id ?? originalRequest.id;

  // ws
  originalRequest.ws = globalThis.sockets?.get(originalRequest.id) ?? null;
  globalThis.sockets?.delete(originalRequest.id);

  // i18n
  originalRequest.i18n = originalRequest.i18n ??
    i18n ?? {
      defaultLocale: '',
      locales: [],
      locale: '',
      t: () => '',
      overrideMessages: () => {},
      pages: {},
    };

  // Indicate
  originalRequest.indicate = (key: string) => ({
    id: `__ind:${key}`,
    value: false,
    error: {},
  });

  // css
  originalRequest._style = '';
  originalRequest.css = (
    template: TemplateStringsArray,
    ...values: string[]
  ) => {
    originalRequest._style += String.raw(template, ...values);
  };

  // Default value of renderInitiator (can change the value outside of this function)
  originalRequest.renderInitiator ??= RenderInitiator.INITIAL_REQUEST;

  return originalRequest as RequestContext;
}
