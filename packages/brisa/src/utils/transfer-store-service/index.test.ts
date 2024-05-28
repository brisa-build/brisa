import { encrypt } from "@/utils/crypto";
import extendRequestContext from "@/utils/extend-request-context";
import transferStoreService from "@/utils/transfer-store-service";
import { describe, it, expect } from "bun:test";

describe("utils", () => {
  describe("transferStoreService", () => {
    it("should transfer store to req.store", async () => {
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000", {
          method: "POST",
          body: JSON.stringify({
            "x-s": [["key", "value"]],
          }),
        }),
      });

      const transferStore = await transferStoreService(req);
      transferStore.transferClientStoreToServer();

      expect(req.store as any).toEqual(new Map([["key", "value"]]));
    });

    it("should transfer store to req.webStore", async () => {
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000", {
          method: "POST",
          body: JSON.stringify({
            "x-s": [["key", "value"]],
          }),
        }),
      });

      const res = new Response();
      const transferStore = await transferStoreService(req);
      transferStore.transferClientStoreToServer();

      expect((req as any).webStore).toEqual(new Map([["key", "value"]]));
    });

    it("should transfer store to req.store without encrypted value", async () => {
      const valueEncrypted = encrypt("value");
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000", {
          method: "POST",
          body: JSON.stringify({
            "x-s": [["key", valueEncrypted]],
          }),
        }),
      });

      const transferStore = await transferStoreService(req);
      transferStore.transferClientStoreToServer();

      // Unencrypt value (server store)
      expect(req.store as any).toEqual(new Map([["key", "value"]]));
    });

    it("should transfer store to req.webStore with encrypted value", async () => {
      const valueEncrypted = encrypt("value");
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000", {
          method: "POST",
          body: JSON.stringify({
            "x-s": [["key", valueEncrypted]],
          }),
        }),
      });

      const transferStore = await transferStoreService(req);
      transferStore.transferClientStoreToServer();

      // Encrypt value
      expect((req as any).webStore).toEqual(new Map([["key", valueEncrypted]]));
    });

    // TODO: awaiting this Bun issue to be solved:
    // https://github.com/oven-sh/bun/issues/2644
    it.todo("should return the formData", async () => {
      const form = new FormData();
      form.append("key", "value");
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000", {
          method: "POST",
          headers: {
            "content-type": "multipart/form-data;",
          },
          body: new FormData(),
        }),
      });

      const transferStore = await transferStoreService(req);
      expect(transferStore.formData).toEqual(form);
    });

    it("should return the body", async () => {
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            key: "value",
          }),
        }),
      });

      const transferStore = await transferStoreService(req);
      expect(transferStore.body).toEqual({ key: "value" });
    });
  });
});
