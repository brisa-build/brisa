// @ts-nocheck
import { MatchedRoute } from "bun";
import { I18nFromRequest, RequestContext } from "../../types";

type ExtendRequestContext = {
  originalRequest: Request;
  currentRequestContext?: RequestContext;
  route?: MatchedRoute;
  i18n?: I18nFromRequest;
  finalURL?: string;
  id?: string;
};

export default function extendRequestContext({
  originalRequest,
  currentRequestContext,
  route,
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
    originalRequest.store ??
    new Map<string, any>();

  // useContext
  originalRequest.useContext = (ctx) => {
    const store = originalRequest.store;
    const context = store.get(ctx.id);

    if (!context) return { value: ctx.defaultValue };

    return {
      value: context.get(context.get("currentProviderId")) ?? ctx.defaultValue,
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
      pages: {},
    };

  return originalRequest as RequestContext;
}
