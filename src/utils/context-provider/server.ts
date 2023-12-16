import { ContextProvider } from "../../types";

export const CURRENT_PROVIDER_ID = Symbol("current-provider-id");

export function contextProvider<T>({
  context,
  value,
  store,
}: ContextProvider<T>) {
  const id = Symbol("context-provider");
  const contextStore = store.get(context.id) ?? new Map<symbol, T>();
  const currentProviderId = contextStore.get(CURRENT_PROVIDER_ID);

  contextStore.set(id, value);
  contextStore.set(CURRENT_PROVIDER_ID, id);

  store.set(context.id, contextStore);

  return () => {
    const contextStore = store.get(context.id);

    contextStore.delete(id);

    if (currentProviderId) {
      contextStore.set(CURRENT_PROVIDER_ID, currentProviderId);
    } else {
      contextStore.delete(CURRENT_PROVIDER_ID);
    }

    store.set(context.id, contextStore);
  };
}
