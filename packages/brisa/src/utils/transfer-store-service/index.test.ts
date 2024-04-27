import { encrypt } from "@/utils/crypto";
import extendRequestContext from "@/utils/extend-request-context";
import transferStoreService from "@/utils/transfer-store-service";
import { describe, it, expect } from "bun:test";

describe("utils", () => {
  describe("transferStoreService", () => {
    it("should transfer store from client to server", () => {
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000", {
          headers: {
            "x-s": encodeURIComponent(JSON.stringify([["key", "value"]])),
          },
        }),
      });

      const transferStore = transferStoreService(req);
      transferStore.transfeClientStoreToServer();

      expect(req.store.get("key")).toBe("value");
    });

    it("should transfer store from server to client", () => {
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000", {
          headers: {
            "x-s": encodeURIComponent(JSON.stringify([["key", "value"]])),
          },
        }),
      });

      const res = new Response();
      const transferStore = transferStoreService(req);
      transferStore.transfeClientStoreToServer();
      transferStore.transferServerStoreToClient(res);

      expect(res.headers.get("X-S")).toBe(
        encodeURIComponent(JSON.stringify([["key", "value"]])),
      );
    });

    it("should transfer store from client to server with encrypted value", () => {
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000", {
          headers: {
            "x-s": encodeURIComponent(
              JSON.stringify([["key", encrypt("value")]]),
            ),
          },
        }),
      });

      const transferStore = transferStoreService(req);
      transferStore.transfeClientStoreToServer();

      expect(req.store.get("key")).toBe("value");
    });

    it("should transfer store from server to client with encrypted value", () => {
      const valueEncrypted = encrypt("value");
      const req = extendRequestContext({
        originalRequest: new Request("http://localhost:3000", {
          headers: {
            "x-s": encodeURIComponent(
              JSON.stringify([["key", valueEncrypted]]),
            ),
          },
        }),
      });

      const res = new Response();
      const transferStore = transferStoreService(req);
      transferStore.transfeClientStoreToServer();
      transferStore.transferServerStoreToClient(res);

      expect(res.headers.get("X-S")).toBe(
        encodeURIComponent(JSON.stringify([["key", valueEncrypted]])),
      );
    });
  });
});
