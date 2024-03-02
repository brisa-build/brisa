// @ts-nocheck
import { MatchedRoute } from "bun";
import { I18n, RequestContext } from "@/types";
import {
  CURRENT_PROVIDER_ID,
  CONTEXT_STORE_ID,
} from "@/utils/context-provider/server";

type ExtendRequestContext = {
  originalRequest: Request;
  currentRequestContext?: RequestContext;
  route?: MatchedRoute;
  store?: RequestContext["store"];
  i18n?: I18n;
  finalURL?: string;
  id?: string;
};

export default function extendRequestContext({
  originalRequest,
  currentRequestContext,
  route,
  store,
  webStore,
  i18n,
  finalURL,
  id,
}: ExtendRequestContext): RequestContext {
  // finalURL
  originalRequest.finalURL =
    currentRequestContext?.finalURL ??
    finalURL ??
    originalRequest.finalURL ??
    originalRequest.url;

  // route
  originalRequest.route =
    currentRequestContext?.route ?? route ?? originalRequest.route;

  // store
  originalRequest.store =
    currentRequestContext?.store ??
    store ??
    originalRequest.store ??
    new Map<string | symbol, any>();

  // webStore (used for store.transferToClient)
  originalRequest.webStore =
    currentRequestContext?.webStore ??
    webStore ??
    originalRequest.webStore ??
    new Map<string | symbol, any>();

  // store.transferToClient
  originalRequest.store.transferToClient = (keys: string[]) => {
    const store = originalRequest.store;
    const webStore = originalRequest.webStore;

    for (let key of keys) {
      webStore.set(key, store.get(key));
    }
  };

  // useContext
  originalRequest.useContext = (ctx) => {
    const store = originalRequest.store;
    const context = store.get(CONTEXT_STORE_ID)?.get(ctx.id);
    let value = ctx.defaultValue;

    if (!context) return { value };

    const provider = context.get(context.get(CURRENT_PROVIDER_ID));

    if (!provider || provider.isProviderPaused()) return { value };

    return {
      value: provider.value ?? value,
    };
  };

  // id
  originalRequest.id = currentRequestContext?.id ?? id ?? originalRequest.id;

  // ws
  originalRequest.ws = globalThis.sockets?.get(originalRequest.id) ?? null;
  globalThis.sockets?.delete(originalRequest.id);

  // i18n
  originalRequest.i18n = currentRequestContext?.i18n ??
    originalRequest.i18n ??
    i18n ?? {
      defaultLocale: "",
      locales: [],
      locale: "",
      t: () => "",
      overrideMessages: () => {},
      pages: {},
    };

  // Indicate
  originalRequest.indicate = (key: string) => ({
    id: `__ind:${key}`,
    value: false,
    error: {},
  });

  return originalRequest as RequestContext;
}
