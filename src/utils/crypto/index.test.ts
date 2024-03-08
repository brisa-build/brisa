import crypto from "node:crypto";
import { describe, it, expect, beforeAll } from "bun:test";

describe("utils", () => {
  beforeAll(() => {
    globalThis.__CRYPTO_KEY__ = crypto.randomBytes(32).toString("hex");
    globalThis.__CRYPTO_IV__ = crypto.randomBytes(8).toString("hex");
  });
  describe("crypto", () => {
    it("should encrypt and decrypt a string", async () => {
      const { encrypt, decrypt } = await import(".");
      const text = "Hello World!";
      const encrypted = encrypt(text);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(text);
      expect(decrypted).not.toBe(encrypted);
      expect(decrypted).toBe(text);
    });

    it("should be possible to encrypt and decrypt multiple times without opening/finish the cypher every time", async () => {
      const { encrypt, decrypt } = await import(".");
      const text = "Hello World!";
      const encrypted = encrypt(text);
      const encrypted2 = encrypt(text);
      const decrypted = decrypt(encrypted);
      const decrypted2 = decrypt(encrypted2);

      expect(encrypted).not.toBe(text);
      expect(encrypted2).not.toBe(text);
      expect(decrypted).toBe(text);
      expect(decrypted2).toBe(text);
    });
  });
});
