import { ContextProvider } from "../../types";

type ContextStoreKey = symbol | string;
type ContextStore = Map<ContextStoreKey, Map<symbol, unknown>>;

export const CURRENT_PROVIDER_ID = Symbol.for("current-provider-id");
export const CONTEXT_STORE_ID = Symbol.for("context");

export function contextProvider<T>({
  context,
  value,
  store,
}: ContextProvider<T>) {
  const id = Symbol("context-provider");
  const { contextStore, providerStore } = getStores();
  const currentProviderId = providerStore.get(CURRENT_PROVIDER_ID);

  providerStore.set(id, value);
  providerStore.set(CURRENT_PROVIDER_ID, id);
  setStores(contextStore, providerStore);

  function setStores(
    contextStore: ContextStore,
    providerStore: Map<symbol, unknown>,
  ) {
    contextStore.set(context.id, providerStore);
    store.set(CONTEXT_STORE_ID, contextStore);
  }

  function getStores() {
    const contextStore =
      store.get(CONTEXT_STORE_ID) ??
      new Map<ContextStoreKey, Map<symbol, unknown>>();
    const providerStore = contextStore.get(context.id) ?? new Map<symbol, T>();
    return { contextStore, providerStore };
  }

  function changeCurrentProvider(
    providerStore: Map<symbol, T>,
    providerId = currentProviderId,
  ) {
    if (providerId) {
      providerStore.set(CURRENT_PROVIDER_ID, providerId);
    } else {
      providerStore.delete(CURRENT_PROVIDER_ID);
    }
    return providerStore;
  }

  /**
   * Clear the context provider
   *
   * Remove the context provider from the store.
   * Useful on close <context-provider>.
   */
  function clearProvider() {
    const { contextStore, providerStore } = getStores();
    providerStore.delete(id);
    setStores(contextStore, changeCurrentProvider(providerStore));
  }

  /**
   * Pause the context provider
   *
   * Useful on close <context-provider> after detecting an <slot>,
   * pausing to then restore the context provider on the slot content.
   */
  function pauseProvider() {
    const { contextStore, providerStore } = getStores();
    setStores(contextStore, changeCurrentProvider(providerStore));
  }

  /**
   * Restore the context provider
   *
   * Useful on close <context-provider> after detecting an <slot>,
   * pausing to then restore the context provider on the slot content.
   */
  function restoreProvider() {
    const { contextStore, providerStore } = getStores();
    setStores(contextStore, changeCurrentProvider(providerStore, id));
  }

  return { clearProvider, pauseProvider, restoreProvider };
}
