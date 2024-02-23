import { describe, it, expect } from "bun:test";
import extendRequestContext from "../extend-request-context";
import getClientStoreEntries from ".";

const url = "https://test.com";

describe("utils", () => {
  describe("get-client-store-entries", () => {
    it("should not return an array of entries when NOT exists on 'x-s' header", () => {
      const headers = new Headers();
      const req = extendRequestContext({
        originalRequest: new Request(url, { headers }),
      });

      req.store.set("foo", "bar");
      req.store.set("bar", "baz");

      const result = getClientStoreEntries(req);

      expect(result).toBeEmpty();
    });

    it("should return an array of entries that exists on 'x-s' header", () => {
      const headers = new Headers();

      headers.set("x-s", JSON.stringify([["foo", "bar"]]));

      const req = extendRequestContext({
        originalRequest: new Request(url, { headers }),
      });

      req.store.set("foo", "bar");
      req.store.set("bar", "baz");

      const result = getClientStoreEntries(req);

      expect(result).toEqual([["foo", "bar"]]);
    });

    it("should return an modified array of entries that exists on 'x-s' header", () => {
      const headers = new Headers();

      headers.set("x-s", JSON.stringify([["foo", "bar"]]));

      const req = extendRequestContext({
        originalRequest: new Request(url, { headers }),
      });

      req.store.set("foo", "baz");
      req.store.set("bar", "baz");

      const result = getClientStoreEntries(req);

      expect(result).toEqual([["foo", "baz"]]);
    });

    it("should return an array of transferred entries with `transferToClient`", () => {
      const headers = new Headers();

      const req = extendRequestContext({
        originalRequest: new Request(url, { headers }),
      });

      req.store.set("foo", "bar");
      req.store.set("bar", "baz");
      req.store.transferToClient(["bar"]);

      const result = getClientStoreEntries(req);

      expect(result).toEqual([["bar", "baz"]]);
    });

    it("should return an array of entries that exists on 'x-s' header and will be transferred with `transferToClient`", () => {
      const headers = new Headers();

      headers.set("x-s", JSON.stringify([["foo", "bar"]]));

      const req = extendRequestContext({
        originalRequest: new Request(url, { headers }),
      });

      req.store.set("foo", "bar");
      req.store.set("bar", "baz");
      req.store.transferToClient(["bar"]);

      const result = getClientStoreEntries(req);

      expect(result).toEqual([
        ["foo", "bar"],
        ["bar", "baz"],
      ]);
    });
  });
});
