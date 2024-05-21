import type { RequestContext } from "@/types";
import {
  ENCRYPT_NONTEXT_PREFIX,
  ENCRYPT_PREFIX,
  decrypt,
} from "@/utils/crypto";
import getClientStoreEntries from "@/utils/get-client-store-entries";
import { logError } from "@/utils/log/log-build";

export default function transferStoreService(req: RequestContext) {
  const encryptedKeys = new Set<string>();
  const storeRaw = req.headers.get("x-s");

  return {
    transfeClientStoreToServer() {
      if (!storeRaw) return;

      let entries = JSON.parse(decodeURIComponent(storeRaw));

      for (const [key, value] of entries) {
        try {
          let storeValue = value;

          if (
            typeof value === "string" &&
            (value.startsWith(ENCRYPT_PREFIX) ||
              value.startsWith(ENCRYPT_NONTEXT_PREFIX))
          ) {
            encryptedKeys.add(key);
            storeValue = decrypt(value);
          }

          req.store.set(key, storeValue);
        } catch (e: any) {
          logError(
            [
              `Error transferring client "${key}" store to server store`,
              e.message,
            ],
            undefined,
            req,
          );
        }
      }
    },
    transferServerStoreToClient(res: Response) {
      res.headers.set(
        "X-S",
        encodeURIComponent(
          JSON.stringify(getClientStoreEntries(req, encryptedKeys)),
        ),
      );
    },
  };
}
