import type { RequestContext } from '@/types';
import {
  ENCRYPT_NONTEXT_PREFIX,
  ENCRYPT_PREFIX,
  decrypt,
  encrypt,
} from '@/utils/crypto';
import { logError } from '@/utils/log/log-build';

export default async function transferStoreService(req: RequestContext) {
  const contentType = req.headers.get('content-type');
  const bodyAvailable = req.method === 'POST' && !req.bodyUsed;
  const isFormData = contentType?.includes('multipart/form-data');
  const formData = isFormData && bodyAvailable ? await req.formData() : null;
  const encryptedKeys = new Set<string>();
  const body = !isFormData && bodyAvailable ? await req.json() : null;
  const originalStoreEntries = formData
    ? JSON.parse(formData.get('x-s')?.toString() ?? '[]')
    : body?.['x-s'];

  if (formData) formData.delete('x-s');

  return {
    formData,
    body,
    transferClientStoreToServer() {
      if (!originalStoreEntries) return;

      for (const [key, value] of originalStoreEntries) {
        try {
          let storeValue = value;
          let encrypt = false;

          if (key == null || key?.startsWith('context:')) continue;

          if (
            typeof value === 'string' &&
            (value.startsWith(ENCRYPT_PREFIX) ||
              value.startsWith(ENCRYPT_NONTEXT_PREFIX))
          ) {
            encryptedKeys.add(key);
            storeValue = decrypt(value);
            encrypt = true;
          }

          req.store.set(key, storeValue);
          req.store.transferToClient([key], { encrypt });
        } catch (e: any) {
          logError({
            messages: [
              `Error transferring client "${key}" store to server store`,
              e.message,
            ],
            docTitle: 'Documentation about store.transferToClient',
            docLink:
              'https://brisa.build/api-reference/components/request-context#transfertoclient',
            req,
          });
        }
      }
    },
  };
}

export function getTransferedServerStoreToClient(request: RequestContext) {
  const store = new Map();
  const webStore = (request as any).webStore as Map<string, any>;

  for (const key of webStore.keys()) {
    const shouldEncrypt = webStore.get(key)?.encrypt ?? false;
    const value = request.store.get(key);
    store.set(key, shouldEncrypt ? encrypt(value) : value);
  }

  return store;
}
