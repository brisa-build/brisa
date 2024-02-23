import type { RequestContext } from "@/types";

export default function getClientStoreEntries(req: RequestContext) {
  const map = new Map<string | symbol, any>();
  const headersStoreRaw = req.headers.get("x-s")!;
  const headersStore = headersStoreRaw ? JSON.parse(headersStoreRaw) : [];

  for (let [key] of headersStore) {
    map.set(key, req.store.get(key));
  }

  for (let [key] of (req as any).webStore) {
    map.set(key, req.store.get(key));
  }

  return [...map.entries()];
}
