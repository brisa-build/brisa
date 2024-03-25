import { describe, it, expect } from "bun:test";
import extendRequestContext from "../extend-request-context";
import getClientStoreEntries from ".";
import { ENCRYPT_PREFIX } from "../crypto";

const url = "https://test.com";
const emptySet = new Set<string>();

describe("utils", () => {
  describe("get-client-store-entries", () => {
    it("should not return an array of entries when NOT exists on 'x-s' header", () => {
      const headers = new Headers();
      const req = extendRequestContext({
        originalRequest: new Request(url, { headers }),
      });

      req.store.set("foo", "bar");
      req.store.set("bar", "baz");

      const result = getClientStoreEntries(req, emptySet);

      expect(result).toBeEmpty();
    });

    it('should not return an array of entries when "x-s" header is an empty string', () => {
      const headers = new Headers();

      headers.set("x-s", "");

      const req = extendRequestContext({
        originalRequest: new Request(url, { headers }),
      });

      req.store.set("foo", "bar");
      req.store.set("bar", "baz");

      const result = getClientStoreEntries(req, emptySet);

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

      const result = getClientStoreEntries(req, emptySet);

      expect(result).toEqual([["foo", "bar"]]);
    });

    it('should emojis work inside the "x-s" header', () => {
      const headers = new Headers();

      headers.set("x-s", encodeURIComponent(JSON.stringify([["foo", "🚀"]])));

      const req = extendRequestContext({
        originalRequest: new Request(url, { headers }),
      });

      req.store.set("foo", "🚀");
      req.store.set("bar", "baz");

      const result = getClientStoreEntries(req, emptySet);

      expect(result).toEqual([["foo", "🚀"]]);
    });

    it("should return an modified array of entries that exists on 'x-s' header", () => {
      const headers = new Headers();

      headers.set("x-s", JSON.stringify([["foo", "bar"]]));

      const req = extendRequestContext({
        originalRequest: new Request(url, { headers }),
      });

      req.store.set("foo", "baz");
      req.store.set("bar", "baz");

      const result = getClientStoreEntries(req, emptySet);

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

      const result = getClientStoreEntries(req, emptySet);

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

      const result = getClientStoreEntries(req, emptySet);

      expect(result).toEqual([
        ["foo", "bar"],
        ["bar", "baz"],
      ]);
    });

    it('should encrypt the value of the entries that exists on "x-s" header', () => {
      const headers = new Headers();

      headers.set("x-s", JSON.stringify([["foo", "bar"]]));

      const req = extendRequestContext({
        originalRequest: new Request(url, { headers }),
      });

      req.store.set("foo", "bar");
      req.store.set("bar", "baz");

      const result = getClientStoreEntries(req, new Set(["foo"]));
      const [key, value] = result[0];

      expect(result).toHaveLength(1);
      expect(key).toBe("foo");
      expect(value).toStartWith(ENCRYPT_PREFIX);
    });
  });
});
