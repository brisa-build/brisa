import { ContextProvider } from "../../types";

export function contextProvider<T>({
  context,
  value,
  store,
}: ContextProvider<T>) {
  const id = Symbol("context-provider");
  const contextStore = store.get(context.id) ?? new Map<symbol, T>();
  const currentProviderId = contextStore.get("currentProviderId");

  contextStore.set(id, value);
  contextStore.set("currentProviderId", id);

  store.set(context.id, contextStore);

  return () => {
    const contextStore = store.get(context.id);

    contextStore.delete(id);

    if (currentProviderId) {
      contextStore.set("currentProviderId", currentProviderId);
    } else {
      contextStore.delete("currentProviderId");
    }

    store.set(context.id, contextStore);
  };
}
