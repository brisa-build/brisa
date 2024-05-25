import type { RequestContext } from "@/types";
import { encrypt } from "@/utils/crypto";

export default function getClientStoreEntries(
  req: RequestContext,
  encryptedKeys: Set<string>,
) {
  const map = new Map<string | symbol, any>();
  const headersStoreRaw = req.headers.get("x-s")!;
  const headersStore = headersStoreRaw
    ? JSON.parse(decodeURIComponent(headersStoreRaw))
    : [];

  for (let [key] of headersStore) {
    let value = req.store.get(key);
    if (encryptedKeys.has(key)) value = encrypt(value);
    map.set(key, value);
  }

  for (let [key] of (req as any).webStore) {
    // Value is already encrypted (if needed) on the webStore
    let value = (req as any).webStore.get(key);
    map.set(key, value);
  }

  return [...map.entries()];
}
