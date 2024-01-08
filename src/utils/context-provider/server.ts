import { ContextProvider, RequestContext } from "@/types";

type ContextStoreKey = symbol | string;
type ContextStore = Map<ContextStoreKey, Map<symbol, unknown>>;
type ProviderContent = {
  value: unknown;
  clearProvider: () => void;
  pauseProvider: () => void;
  restoreProvider: () => void;
  isProviderPaused: () => boolean;
  addSlot: (slotName: string) => void;
  hasSlot: (slotName: string) => boolean;
  hasSomeSlot: () => boolean;
  webComponentSymbol?: symbol;
};

export const CURRENT_PROVIDER_ID = Symbol.for("current-provider-id");
export const CONTEXT_STORE_ID = Symbol.for("context");

export function contextProvider<T>({
  context,
  value,
  store,
  webComponentSymbol,
}: ContextProvider<T>): ProviderContent {
  const id = Symbol("context-provider");
  const { contextStore, providerStore } = getStores();
  const detectedSlots = new Set<string>();
  let currentProviderId = providerStore.get(CURRENT_PROVIDER_ID);
  let isPaused = false;

  function setStores(
    contextStore: ContextStore,
    providerStore: Map<symbol, ProviderContent>,
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

  /**
   * Add a detected slot
   */
  function addSlot(slotName: string) {
    detectedSlots.add(slotName);
  }

  /**
   * Check if a slot was detected
   */
  function hasSlot(slotName: string) {
    return detectedSlots.has(slotName);
  }

  /**
   * Check if some slot was detected
   */
  function hasSomeSlot() {
    return detectedSlots.size > 0;
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
    providerStore.set(CURRENT_PROVIDER_ID, currentProviderId);
    setStores(contextStore, providerStore);
  }

  /**
   * Pause the context provider
   *
   * Useful on close <context-provider> after detecting an <slot>,
   * pausing to then restore the context provider on the slot content.
   */
  function pauseProvider() {
    const { contextStore, providerStore } = getStores();
    isPaused = true;
    providerStore.set(CURRENT_PROVIDER_ID, currentProviderId);
    setStores(contextStore, providerStore);
  }

  /**
   * Restore the context provider
   *
   * Useful on close <context-provider> after detecting an <slot>,
   * pausing to then restore the context provider on the slot content.
   */
  function restoreProvider() {
    const { contextStore, providerStore } = getStores();
    isPaused = false;
    currentProviderId = providerStore.get(CURRENT_PROVIDER_ID);
    providerStore.set(CURRENT_PROVIDER_ID, id);
    setStores(contextStore, providerStore);
  }

  function isProviderPaused() {
    return isPaused;
  }

  const providerContent: ProviderContent = {
    value,
    clearProvider,
    pauseProvider,
    restoreProvider,
    isProviderPaused,
    addSlot,
    hasSlot,
    hasSomeSlot,
    webComponentSymbol,
  };

  providerStore.set(id, providerContent);
  providerStore.set(CURRENT_PROVIDER_ID, id);
  setStores(contextStore, providerStore);

  return providerContent;
}

/**
 * Register the slot name to the active context providers
 */
export function registerSlotToActiveProviders(
  slotName: string,
  requestContext: RequestContext,
) {
  const contextStore = requestContext.store.get(CONTEXT_STORE_ID) ?? new Map();

  for (const providerStore of contextStore.values()) {
    const currentProviderId = providerStore.get(CURRENT_PROVIDER_ID);

    if (!currentProviderId) continue;
    providerStore.get(currentProviderId)?.addSlot(slotName);
  }
}

function forEachActiveProvider(
  requestContext: RequestContext,
  callback: (provider: ProviderContent, context: Map<symbol, unknown>) => void,
) {
  const contextStore = requestContext.store.get(CONTEXT_STORE_ID) ?? new Map();

  for (const providerStore of contextStore.values()) {
    for (const provider of providerStore.values()) {
      if (!provider || typeof provider === "symbol") continue;
      callback(provider, providerStore);
    }
  }
}

/**
 * Restore the context providers and return the restored providers
 */
export function restoreSlotProviders(
  slotName: string,
  requestContext: RequestContext,
) {
  const providers: ReturnType<typeof contextProvider>[] = [];

  forEachActiveProvider(requestContext, (provider) => {
    if (provider.isProviderPaused() && provider.hasSlot(slotName)) {
      provider.restoreProvider();
      providers.push(provider);
    }
  });

  return providers;
}

/**
 * Clear the context providers by webComponentSymbol
 */
export function clearProvidersByWCSymbol(
  webComponentSymbol: symbol,
  requestContext: RequestContext,
) {
  forEachActiveProvider(requestContext, (provider, providerStore) => {
    if (provider.webComponentSymbol === webComponentSymbol) {
      provider.clearProvider();

      // Clear if the only one is the symbol for current provider id
      // because now there aren't providers in this context
      if (providerStore.size === 1) providerStore.clear();
    }
  });
}
